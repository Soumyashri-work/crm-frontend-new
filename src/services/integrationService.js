/**
 * services/integrationService.js
 *
 * API layer + React Query hooks for the CRM integration lifecycle.
 *
 * Active backend endpoints (app/routes/credentials.py, prefix /api/v1):
 *   POST   /integrations/                              → provision
 *   PATCH  /integrations/{id}/credentials              → update credentials
 *   DELETE /integrations/{id}/credentials              → revoke (soft delete)
 *   GET    /integrations/{id}/credentials/status       → metadata, no secrets
 *   GET    /integrations/{id}/verify                   → on-demand health check
 *   POST   /integrations/{id}/credentials/rotate       → Infisical key re-encryption (admin)
 *
 * Payload contract (POST /integrations/):
 *   ProvisionCredentialsRequest:
 *   {
 *     crm_type:    string,
 *     base_url:    string,
 *     credentials: CredentialPayload,   // discriminated union on auth_type (NOT strategy)
 *     webhook_secret?:      string,     // top-level — stored in webhook_secrets_enc
 *     per_event_secrets?:   Record<string, string>,  // top-level — stored in webhook_secrets_enc
 *     extra_metadata?:      Record<string, unknown>,
 *   }
 *
 * CredentialPayload variants (discriminator: auth_type):
 *   { auth_type: "api_token"|"bearer_token"|"access_token"|"api_key", token: string }
 *   { auth_type: "basic_auth", username: string, password: string }
 *   { auth_type: "oauth2", access_token: string, refresh_token?, token_type?, expires_at?, client_id?, client_secret? }
 *   { auth_type: "hmac", api_token?: string, webhook_secret?: string, per_event_secrets?: Record<string,string> }
 *
 * Response (CredentialStatusResponse):
 *   { integration_id, crm_type, auth_type, base_url, key_version,
 *     is_active, has_credentials, has_webhook_secrets,
 *     token_expires_at?, created_at, updated_at }
 *
 * 403 error shape (PermissionValidationError):
 *   { detail: { error: "insufficient_crm_permissions", message: string, failed_checks: string[] } }
 *
 * Error handling
 * --------------
 * FastAPI returns { detail: string|array|object } for 4xx/5xx.
 * extractError() normalises all variants into a plain Error whose .message
 * is safe to display, and attaches .failedChecks (string[] | null) for 403s.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from './api'; // shared Axios instance (baseURL already set to /api/v1)

// ─────────────────────────────────────────────────────────────────────────────
// Query key factory
// ─────────────────────────────────────────────────────────────────────────────

export const integrationKeys = {
  /** Root key — invalidate this to bust all integration queries */
  all: ()      => ['integrations'],

  /** List of all active integrations for the tenant (used for mount-time hydration) */
  active: ()   => ['integrations', 'active'],

  /** Scoped to a single integration */
  detail: (id) => ['integrations', id],

  /** Verify sub-key (separate so health checks don't bust list caches) */
  verify: (id) => ['integrations', id, 'verify'],
};

/** Key for the static CRM config catalogue (changes only on deploy) */
export const configKeys = {
  crms: () => ['config', 'crms'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal: FastAPI error normalisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FastAPI errors come back as:
 *   { detail: "..." }                               — HTTPException (string)
 *   { detail: [{loc, msg, type}] }                  — Pydantic 422
 *   { detail: { error, message, failed_checks[] } } — structured 403
 *
 * Returns a plain string for .message and attaches .failedChecks on the Error
 * object for 403 responses so callers can render the check list.
 */
function extractError(error) {
  const data  = error?.response?.data ?? error?.data;
  const status = error?.response?.status ?? error?.status;

  if (!data) {
    return { message: error?.message ?? 'An unexpected error occurred.', failedChecks: null };
  }

  const { detail } = data;

  // Pydantic 422 — array of { loc, msg, type }
  if (Array.isArray(detail)) {
    const message = detail.map((d) => `${d.loc?.join(' → ')}: ${d.msg}`).join('; ');
    return { message, failedChecks: null };
  }

  // Structured 403 — { error, message, failed_checks }
  if (detail && typeof detail === 'object') {
    return {
      message: detail.message ?? JSON.stringify(detail),
      failedChecks: Array.isArray(detail.failed_checks) ? detail.failed_checks : null,
    };
  }

  // Plain string
  if (typeof detail === 'string') {
    return { message: detail, failedChecks: null };
  }

  return { message: JSON.stringify(detail), failedChecks: null };
}

/**
 * Wrap an Axios error into a consistent Error object that React Query
 * surfaces via `error.message` and optionally `error.failedChecks`.
 */
function buildError(err) {
  const { message, failedChecks } = extractError(err);
  return Object.assign(new Error(message), {
    status: err?.response?.status ?? null,
    failedChecks,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Low-level API calls
// ─────────────────────────────────────────────────────────────────────────────

export const integrationApi = {
  /**
   * GET /config/crms
   * Fetch all supported CRM adapters with complete metadata.
   * Drives the dynamic CRM selection grid — no hardcoded configs in the UI.
   *
   * @returns {Promise<SupportedCrmsResponse>}
   *   { crms: CrmInfoSchema[], total: number }
   */
  fetchCrmConfigs: async () => {
    try {
      const res = await api.get('/config/crms');
      return res.data; // SupportedCrmsResponse
    } catch (err) {
      throw buildError(err);
    }
  },

  /**
   * POST /integrations/check-connection
   * Test whether the provided credentials can authenticate against the CRM
   * WITHOUT persisting anything. Acts as a pre-flight before provisioning.
   *
   * Accepts the same payload shape as provision() (ProvisionCredentialsRequest)
   * so callers can pass the output of transformFormToPayload() directly.
   *
   * On success:  { status: "ok" }                         (200)
   * On failure:  403 with failed_checks[] in detail       (403)
   *              or 502 if the CRM itself is unreachable   (502)
   *
   * @param {object} payload  — built by transformFormToPayload()
   * @returns {Promise<{ status: string }>}
   */
  checkConnection: async (payload) => {
    try {
      const res = await api.post('/integrations/check-connection', payload);
      return res.data;
    } catch (err) {
      throw buildError(err);
    }
  },

  /**
   * POST /integrations/
   * Provision a new CRM integration.
   *
   * @param {object} payload  — built by transformFormToPayload()
   * @returns {Promise<CredentialStatusResponse>}
   */
  provision: async (payload) => {
    try {
      const res = await api.post('/integrations/', payload);
      return res.data; // 201 → CredentialStatusResponse
    } catch (err) {
      throw buildError(err);
    }
  },

  /**
   * PATCH /integrations/{integrationId}/credentials
   * Replace / partially update credentials for an existing integration.
   *
   * Payload matches UpdateCredentialsRequest:
   *   { base_url?, credentials?, webhook_secret?, per_event_secrets? }
   *
   * @param {{ integrationId: string, payload: object }} args
   * @returns {Promise<CredentialStatusResponse>}
   */
  update: async ({ integrationId, payload }) => {
    try {
      const res = await api.patch(`/integrations/${integrationId}/credentials`, payload);
      return res.data;
    } catch (err) {
      throw buildError(err);
    }
  },

  /**
   * DELETE /integrations/{integrationId}/credentials
   * Revoke (soft-delete) an integration.
   * Pass wipe=true to also null out the encrypted credential blobs.
   *
   * @param {{ integrationId: string, wipe?: boolean }} args
   * @returns {Promise<void>}  — 204 No Content
   */
  deprovision: async ({ integrationId, wipe = false }) => {
    try {
      await api.delete(`/integrations/${integrationId}/credentials`, {
        params: wipe ? { wipe: true } : undefined,
      });
    } catch (err) {
      throw buildError(err);
    }
  },

  /**
   * GET /integrations/{integrationId}/verify
   * On-demand health check — runs authenticate() + verify_connection().
   *
   * @param {string} integrationId
   * @returns {Promise<{ integration_id: string, status: "verified" }>}
   */
  verify: async (integrationId) => {
    try {
      const res = await api.get(`/integrations/${integrationId}/verify`);
      return res.data;
    } catch (err) {
      throw buildError(err);
    }
  },

  /**
   * GET /tenant-source-systems/active?tenant_id=<uuid>
   * Fetch all active source-system integrations for the given tenant.
   * Used on mount to hydrate crmStatuses so green "Integrated" borders
   * survive page refreshes.
   *
   * Response shape: TenantActiveIntegrationsResponse
   *   { tenant_id, active_source_system_ids: number[], count: number }
   *
   * @param {string} tenantId  — UUID of the tenant (from auth context)
   * @returns {Promise<TenantActiveIntegrationsResponse>}
   */
  listActiveByTenant: async (tenantId) => {
    try {
      const res = await api.get('/tenant-source-systems/active', {
        params: { tenant_id: tenantId },
      });
      return res.data; // { tenant_id, active_source_system_ids, count }
    } catch (err) {
      throw buildError(err);
    }
  },

  /**
   * GET /integrations/{integrationId}/credentials/status
   * Fetch metadata without decrypting secrets.
   *
   * @param {string} integrationId
   * @returns {Promise<CredentialStatusResponse>}
   */
  status: async (integrationId) => {
    try {
      const res = await api.get(`/integrations/${integrationId}/credentials/status`);
      return res.data;
    } catch (err) {
      throw buildError(err);
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Payload transformer
//
// Converts the form's internal data model into a ProvisionCredentialsRequest
// that matches the backend schema exactly.
//
// Key rules:
//   1. credentials.auth_type  — the discriminator field (not "strategy")
//   2. hmac auth_type         — outbound api_token goes inside credentials;
//                               webhook secrets go top-level (service merges both)
//   3. webhook secrets        — ALWAYS top-level fields on the request,
//                               regardless of auth_type (except hmac can carry
//                               them inside credentials too — we use top-level
//                               for consistency)
// ─────────────────────────────────────────────────────────────────────────────

/** Auth types that supply a single token string via cred_token */
const TOKEN_LIKE_TYPES = new Set([
  'api_token',
  'bearer_token',
  'access_token',
  'api_key',
]);

/**
 * Build the ProvisionCredentialsRequest payload the backend expects.
 *
 * auth_type → credentials shape:
 *   api_token / bearer_token / access_token / api_key
 *       → { auth_type, token }
 *   basic_auth
 *       → { auth_type: "basic_auth", username, password }
 *   oauth2
 *       → { auth_type: "oauth2", access_token, refresh_token?, token_type?, ... }
 *   hmac
 *       → { auth_type: "hmac", api_token? }
 *
 * Webhook secrets (always top-level):
 *   shared model    → { webhook_secret: "..." }
 *   per_event model → { per_event_secrets: { "Event.name": "secret" } }
 *
 * @param {object} entry  — form values enriched with _webhookModel
 * @returns {ProvisionCredentialsRequest}
 */
export function transformFormToPayload(entry) {
  const { auth_type, enable_webhooks, crm_type, base_url } = entry;

  // ── Outbound credentials (stored in credential_enc) ───────────────────
  let credentials = null;

  if (TOKEN_LIKE_TYPES.has(auth_type)) {
    credentials = { auth_type, token: entry.cred_token };

  } else if (auth_type === 'basic_auth') {
    credentials = {
      auth_type: 'basic_auth',
      username:  entry.cred_username,
      password:  entry.cred_password,
    };

  } else if (auth_type === 'oauth2') {
    credentials = {
      auth_type:     'oauth2',
      access_token:  entry.cred_access_token,
      token_type:    entry.cred_token_type || 'Bearer',
      ...(entry.cred_refresh_token  && { refresh_token:  entry.cred_refresh_token }),
      ...(entry.cred_expires_at     && { expires_at:     Number(entry.cred_expires_at) }),
      ...(entry.cred_client_id      && { client_id:      entry.cred_client_id }),
      ...(entry.cred_client_secret  && { client_secret:  entry.cred_client_secret }),
    };

  } else if (auth_type === 'hmac') {
    // Outbound only: api_token authenticates calls FROM us TO the CRM.
    // Inbound webhook secrets go top-level (see below).
    credentials = {
      auth_type: 'hmac',
      ...(entry.cred_token && { api_token: entry.cred_token }),
    };
  }

  // ── Strip blank / null values from credentials ────────────────────────
  if (credentials) {
    Object.keys(credentials).forEach((k) => {
      if (k !== 'auth_type' && (credentials[k] === '' || credentials[k] == null)) {
        delete credentials[k];
      }
    });
  }

  // ── Inbound webhook secrets (stored in webhook_secrets_enc, top-level) ─
  let webhookFields = {};

  if (enable_webhooks) {
    const crmWebhookModel = entry._webhookModel; // injected by the form before calling

    if (crmWebhookModel === 'shared') {
      if (entry.webhook_secret?.trim()) {
        webhookFields.webhook_secret = entry.webhook_secret;
      }

    } else if (crmWebhookModel === 'per_event') {
      const perEventObj = {};
      (entry.per_event_secrets ?? []).forEach(({ event, secret }) => {
        if (event?.trim()) perEventObj[event.trim()] = secret;
      });
      if (Object.keys(perEventObj).length > 0) {
        webhookFields.per_event_secrets = perEventObj;
      }
    }
  }

  return {
    crm_type,
    base_url,
    credentials,
    ...webhookFields,
    extra_metadata: {},
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// React Query — Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all supported CRM adapters and their metadata from the backend.
 *
 * Maps to: GET /config/crms
 *
 * Data is treated as near-static (changes only on deploy), so staleTime is
 * set to 5 minutes to avoid redundant fetches across component mounts.
 *
 * Usage:
 *   const { data, isLoading, error } = useCrmConfigs();
 *   // data shape: { crms: CrmInfoSchema[], total: number }
 *   // access the list via: data?.crms
 *
 * @param {object} [options]  — merged into useQuery options
 */
export function useCrmConfigs(options = {}) {
  return useQuery({
    queryKey: configKeys.crms(),
    queryFn:  integrationApi.fetchCrmConfigs,
    staleTime: 5 * 60 * 1000, // 5 min — CRM catalogue is effectively static
    retry: 2,
    ...options,
  });
}

/**
 * Fetch all active source-system integrations for the current tenant on mount.
 *
 * Maps to: GET /tenant-source-systems/active?tenant_id=<uuid>
 *
 * Used by ProvisionCredentialsForm to seed `crmStatuses` on mount so that
 * green "Integrated" borders on CRM cards survive page refreshes — the
 * component is no longer relying on ephemeral React state alone.
 *
 * The query is disabled until `tenantId` is available so it never fires
 * with an undefined param (which would return a 422).
 *
 * staleTime is kept at 60 s: the list only changes after a provision or
 * deprovision, and those mutations already invalidate integrationKeys.all().
 *
 * Usage:
 *   const { data } = useActiveIntegrations(tenantId);
 *   // data shape: { tenant_id, active_source_system_ids: number[], count }
 *   // access active IDs via: data?.active_source_system_ids
 *
 * @param {string|null|undefined} tenantId  — UUID from auth context
 * @param {object} [options]  — merged into useQuery options
 */
export function useActiveIntegrations(tenantId, options = {}) {
  return useQuery({
    queryKey: [...integrationKeys.active(), tenantId],
    queryFn:  () => integrationApi.listActiveByTenant(tenantId),
    enabled:  !!tenantId, // don't fire until we have a tenant_id
    staleTime: 60 * 1000, // 1 min — only changes on provision / deprovision
    retry: 1,
    ...options,
  });
}

/**
 * Fetch live metadata for an existing integration (no secrets returned).
 *
 * Maps to: GET /integrations/{id}/credentials/status
 *
 * Used by PageConfigureCrm when editing an already-provisioned integration:
 * pre-fills base_url / auth_type and locks the form in read-only mode until
 * the admin explicitly clicks Reset.
 *
 * Pass `enabled: !!integrationId` so the query only fires when an ID exists.
 *
 * Usage:
 *   const { data } = useIntegrationStatus(integrationId, { enabled: !!integrationId });
 *   // data shape: CredentialStatusResponse
 *
 * @param {string|null} integrationId
 * @param {object}      [options]  — merged into useQuery options
 */
export function useIntegrationStatus(integrationId, options = {}) {
  return useQuery({
    queryKey: integrationKeys.detail(integrationId),
    queryFn:  () => integrationApi.status(integrationId),
    enabled:  !!integrationId,
    staleTime: 30 * 1000, // 30 s — status is stable but not static
    retry: 1,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// React Query — Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Test a connection WITHOUT persisting credentials.
 *
 * Maps to: POST /integrations/check-connection
 *
 * Accepts the same payload as useProvisionIntegration — pass the output of
 * transformFormToPayload() directly. No cache invalidation needed because
 * nothing is written to the backend.
 *
 * Usage:
 *   const mutation = useTestConnection();
 *   mutation.mutate(transformFormToPayload(enrichedValues), {
 *     onSuccess: () => { ... },   // 200 — credentials verified
 *     onError:   (err) => { ... } // err.failedChecks populated on 403
 *   });
 *
 * @param {object} [options]
 */
export function useTestConnection(options = {}) {
  return useMutation({
    mutationFn: integrationApi.checkConnection,
    onSuccess:  (data)  => options.onSuccess?.(data),
    onError:    (error) => options.onError?.(error),
    onSettled:  options.onSettled,
    ...options,
  });
}

/**
 * Provision a new CRM integration.
 *
 * Usage:
 *   const mutation = useProvisionIntegration();
 *   mutation.mutate(transformFormToPayload(formEntry));
 *
 * On 403: error.failedChecks is populated with the list of failed permission
 * checks so the UI can render them individually.
 *
 * @param {object} [options]
 */
export function useProvisionIntegration(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: integrationApi.provision,

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.all() });

      if (data?.integration_id) {
        queryClient.setQueryData(integrationKeys.detail(data.integration_id), data);
      }

      options.onSuccess?.(data);
    },

    onError: (error) => options.onError?.(error),
    onSettled: options.onSettled,
    ...options,
  });
}

/**
 * Update (replace) credentials for an existing integration.
 *
 * Maps to: PATCH /integrations/{id}/credentials  (UpdateCredentialsRequest)
 *
 * Usage:
 *   const mutation = useUpdateCredentials();
 *   mutation.mutate({ integrationId, payload: transformFormToPayload(entry) });
 *
 * @param {object} [options]
 */
export function useUpdateCredentials(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: integrationApi.update,

    onSuccess: (data, { integrationId }) => {
      queryClient.invalidateQueries({ queryKey: integrationKeys.detail(integrationId) });
      options.onSuccess?.(data);
    },

    onError: (error) => options.onError?.(error),
    onSettled: options.onSettled,
    ...options,
  });
}

/**
 * @deprecated Use useUpdateCredentials instead.
 * Kept as an alias so any existing call sites compile without changes.
 */
export const useRotateCredentials = useUpdateCredentials;

/**
 * Revoke (soft-delete) an integration.
 *
 * Maps to: DELETE /integrations/{id}/credentials
 *
 * Usage:
 *   const mutation = useDeprovisionIntegration();
 *   mutation.mutate({ integrationId: "uuid", wipe: true });
 *
 * @param {object} [options]
 */
export function useDeprovisionIntegration(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: integrationApi.deprovision,

    onSuccess: (_data, { integrationId }) => {
      queryClient.removeQueries({ queryKey: integrationKeys.detail(integrationId) });
      queryClient.invalidateQueries({ queryKey: integrationKeys.all() });
      options.onSuccess?.();
    },

    onError:   (error) => options.onError?.(error),
    onSettled: options.onSettled,
    ...options,
  });
}

/**
 * On-demand verify query (manual — does NOT auto-fetch on mount).
 *
 * Maps to: GET /integrations/{id}/verify
 *
 * Usage:
 *   const { refetch, isFetching, data, error } = useVerifyIntegration(id);
 *   <button onClick={refetch}>Check connection</button>
 *
 * @param {string|null} integrationId
 * @param {object}      [options]
 */
export function useVerifyIntegration(integrationId, options = {}) {
  return useQuery({
    queryKey: integrationKeys.verify(integrationId),
    queryFn:  () => integrationApi.verify(integrationId),

    enabled:   false, // callers trigger via refetch()
    staleTime: 0,
    gcTime:    0,
    retry:     false, // a 502 is a real failure, not transient

    ...options,
  });
}