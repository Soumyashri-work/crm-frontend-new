/**
 * ProvisionCredentialsForm.jsx  ─  v7 · Schema-aligned
 * ─────────────────────────────────────────────────────────────────────────────
 * Changes from v6:
 *  • TOKEN_LIKE in superRefine now includes 'hmac' — cred_token required for HMAC
 *  • TOKEN_LIKE in the render path now includes 'hmac' — TokenCredFields renders
 *    for HMAC auth_type (collecting the outbound API key → credentials.api_token)
 *  • 403 permission-failure banner lists each individual failed_check string
 *    (surfaced via provisionMutation.error.failedChecks)
 *  • onSubmit injects _webhookModel before calling transformFormToPayload —
 *    unchanged but clarified in comment
 *
 * Dependencies: react-hook-form  zod  @hookform/resolvers/zod  @tanstack/react-query
 */

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  useProvisionIntegration,
  transformFormToPayload,
} from '../services/integrationService';

import './ProvisionCredentialsForm.css';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK BACKEND SCHEMA  (drives the UI only)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_CRM_CONFIGS = [
  {
    value: 'zammad',
    label: 'Zammad',
    description: 'Open-source helpdesk & ticketing',
    defaultBaseUrl: 'https://support.yourcompany.com',
    supportedAuthTypes: [
      { value: 'api_token', label: 'API Token', icon: 'T' },
      { value: 'basic_auth', label: 'Basic Auth', icon: 'U' },
    ],
    webhookModel: 'shared',
    instructions: {
      api_token: [
        'Log in to your Zammad instance.',
        'Click your avatar at the top-right → select Profile.',
        'In the left sidebar, click Token Access.',
        'Click the + Create button.',
        'Enter a label.',
        'Select the permissions you need (e.g. ticket.agent, admin).',
        'Optionally set an expiry date.',
        'Click Create — copy the token immediately.',
      ],
      basic_auth: [
        'No token creation needed.',
        'Use your existing Zammad login credentials directly.',
        'Format: username:password.',
        'Note: Basic auth can be disabled by your admin — check Admin → Security → Authentication.',
      ],
    },
    webhookInstructions: [
      'Webhook setup',
      'Go to Admin → System → Webhooks.',
      'Click "Add Webhook".',
      'Enter a name for this webhook (e.g., "Dashboard Ingest").',
      'Paste the provided Endpoint URL into the URL field.',
      'Generate a random secret token, save it securely, and paste it into our dashboard in the Webhook Secret field.',
      'Set SSL Verification to "yes".',
      'Click Submit to create the webhook.',
      'Trigger setup',
      'Next, set up a Trigger to connect the webhook to events:',
      'Go to Admin → System → Triggers.',
      'Click "Add Trigger".',
      'Set conditions for when the trigger fires (e.g., "Action is updated" or "Ticket created").',
      'Under "Execute changes on objects", select "Webhook" and choose the webhook you just created.',
      'Click Submit to complete the trigger setup.',
    ],
  },
  {
    value: 'espocrm',
    label: 'EspoCRM',
    description: 'Self-hosted open-source CRM',
    defaultBaseUrl: 'https://crm.yourcompany.com',
    supportedAuthTypes: [
      { value: 'api_key', label: 'API Key (Recommended)', icon: 'K' },
      { value: 'hmac', label: 'HMAC (API key + secret key)', icon: 'H' },
      { value: 'basic_auth', label: 'Basic Auth', icon: 'U' },
    ],
    webhookModel: 'per_event',
    instructions: {
      api_key: [
        'Log in to EspoCRM as Administrator.',
        'Go to Admin (top-right menu) → API Users.',
        'Click Create API User.',
        'Enter a name.',
        'Set the Role to define access.',
        'Choose Authentication Method → API Key.',
        'Click Save.',
        'Copy the generated API Key.',
      ],
      hmac: [
        'Log in to EspoCRM as Administrator.',
        'Go to Admin (top-right menu) → API Users.',
        'Click Create API User.',
        'Enter a name and assign a Role.',
        'Choose Authentication Method → HMAC.',
        'Click Save.',
        'Copy both the API Key and the Secret Key.',
        'Paste the API Key into the "API Key" field in our dashboard.',
        'Note: The secret key is used internally for request signing and does not need to be stored here.',
      ],
      basic_auth: [
        'No API user setup needed.',
        "Use an existing EspoCRM user's login and password.",
        "Note: The user must have API access enabled — go to Admin → Users → edit the user → check 'Allow API access'.",
      ],
    },
    webhookInstructions: [
      'Go to Admin → Webhooks.',
      'Click "Create Webhook".',
      'Enter a name for this webhook.',
      'Paste the provided Endpoint URL into the Webhook URL field.',
      'Set the Payload Version to the latest available.',
      'Configure event types: Select which entity events trigger this webhook (e.g., Lead.create, Lead.update).',
      'For each event, you may optionally set a per-event secret. Use the secrets provided in our dashboard.',
      'Click Save to create the webhook.',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ZOD SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const webhookEventSchema = z.object({
  event:  z.string().min(1, 'Event name is required'),
  secret: z.string().min(1, 'Secret is required'),
});

/**
 * Auth types that supply a single outbound token via cred_token.
 * 'hmac' is included because EspoCRM HMAC requires an API Key (the outbound
 * token) which the service maps to credentials.api_token.
 */
const TOKEN_LIKE_AUTH_TYPES = [
  'api_token',
  'bearer_token',
  'access_token',
  'api_key',
  'hmac',         // ← HMAC outbound API key collected via cred_token
];

const crmEntrySchema = z
  .object({
    crm_type:          z.string().min(1),
    base_url:          z.string().min(1, 'Base URL is required').url('Must be a valid URL'),
    auth_type:         z.string().min(1, 'Select an auth method'),
    cred_token:        z.string().optional(),
    cred_username:     z.string().optional(),
    cred_password:     z.string().optional(),
    cred_access_token: z.string().optional(),
    cred_refresh_token:z.string().optional(),
    cred_token_type:   z.string().optional(),
    cred_expires_at:   z.string().optional(),
    cred_client_id:    z.string().optional(),
    cred_client_secret:z.string().optional(),
    enable_webhooks:   z.boolean().default(false),
    webhook_secret:    z.string().optional(),
    per_event_secrets: z.array(webhookEventSchema).optional(),
  })
  .superRefine((d, ctx) => {
    // Token-like auth types (including hmac) require the token field
    if (TOKEN_LIKE_AUTH_TYPES.includes(d.auth_type) && !d.cred_token?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['cred_token'],
        message: d.auth_type === 'hmac' ? 'API Key is required' : 'Token / key is required',
      });
    }

    if (d.auth_type === 'basic_auth') {
      if (!d.cred_username?.trim())
        ctx.addIssue({ code: 'custom', path: ['cred_username'], message: 'Username is required' });
      if (!d.cred_password?.trim())
        ctx.addIssue({ code: 'custom', path: ['cred_password'], message: 'Password is required' });
    }

    if (d.auth_type === 'oauth2' && !d.cred_access_token?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['cred_access_token'], message: 'Access token is required' });
    }

    if (d.enable_webhooks) {
      const crmCfg = MOCK_CRM_CONFIGS.find((c) => c.value === d.crm_type);
      if (crmCfg?.webhookModel === 'shared' && !d.webhook_secret?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['webhook_secret'], message: 'Webhook secret is required' });
      }
      if (crmCfg?.webhookModel === 'per_event') {
        if (!d.per_event_secrets || d.per_event_secrets.length === 0) {
          ctx.addIssue({ code: 'custom', path: ['per_event_secrets'], message: 'Add at least one event secret' });
        }
      }
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT ENTRY
// ─────────────────────────────────────────────────────────────────────────────

function makeCrmEntry(crmValue) {
  const cfg = MOCK_CRM_CONFIGS.find((c) => c.value === crmValue);
  return {
    crm_type:           crmValue,
    base_url:           cfg?.defaultBaseUrl ?? '',
    auth_type:          cfg?.supportedAuthTypes[0]?.value ?? '',
    cred_token:         '',
    cred_username:      '',
    cred_password:      '',
    cred_access_token:  '',
    cred_refresh_token: '',
    cred_token_type:    'Bearer',
    cred_expires_at:    '',
    cred_client_id:     '',
    cred_client_secret: '',
    enable_webhooks:    false,
    webhook_secret:     '',
    per_event_secrets:  [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Breadcrumb({ step }) {
  const steps = { SELECT_CRM: 'Select CRM', CONFIGURE_CRM: 'Configure & Provision' };
  return (
    <div className="pcf-breadcrumb">
      <span>Settings</span>
      <span className="pcf-breadcrumb-sep">/</span>
      <span>Integrations</span>
      <span className="pcf-breadcrumb-sep">/</span>
      <span style={{ color: 'var(--t1)', fontWeight: 700 }}>{steps[step] || 'Provision New'}</span>
    </div>
  );
}

function ErrMsg({ msg }) {
  if (!msg) return null;
  return (
    <span className="pcf-errmsg">
      <svg width="12" height="12" fill="none" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {msg}
    </span>
  );
}

function Field({ label, required, optional, hint, error, children, style }) {
  return (
    <div className="pcf-field" style={style}>
      {label && (
        <label className="pcf-lbl">
          {label}
          {required && <span className="pcf-req">*</span>}
          {optional && <span className="pcf-opt">optional</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="pcf-hint">{hint}</span>}
      <ErrMsg msg={error} />
    </div>
  );
}

const BackArrowSVG = () => (
  <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
    <path d="M10 3l-6 5 6 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusSVG = () => (
  <svg width="11" height="11" fill="none" viewBox="0 0 14 14">
    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const InfoSVG = () => (
  <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="7" />
    <path d="M8 5v4.5M8 12h.01" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronSVG = () => (
  <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
    <path d="M6 5l4 3-4 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// COPYABLE FIELD
// ─────────────────────────────────────────────────────────────────────────────

function CopyableField({ crmType, label, hint }) {
  const [copied, setCopied] = useState(false);
  const endpointUrl = `https://api.yourdashboard.com/webhooks/ingest/${crmType}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(endpointUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Field label={label} hint={hint || 'Copy this URL and paste it into your CRM webhook configuration'}>
      <div className="pcf-copyable-wrapper">
        <input type="text" value={endpointUrl} readOnly className="pcf-input pcf-copyable-input" />
        <button
          type="button"
          className={`pcf-copy-btn${copied ? ' pcf-copy-btn--copied' : ''}`}
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.5 2.5L6 9l-4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="12" height="12" fill="none" viewBox="0 0 16 16">
                <path d="M6 1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7M14 1H9v4h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
    </Field>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELP BOX
// ─────────────────────────────────────────────────────────────────────────────

function HelpBox({ instructions, title }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!instructions || instructions.length === 0) return null;

  return (
    <div className="pcf-help">
      <button type="button" className="pcf-help-trigger" onClick={() => setIsOpen(!isOpen)}>
        <div className="pcf-help-ico"><InfoSVG /></div>
        <span className="pcf-help-title">{title}</span>
        <span className={`pcf-help-chevron${isOpen ? ' pcf-help-chevron--open' : ''}`}>
          <ChevronSVG />
        </span>
      </button>
      {isOpen && (
        <div className="pcf-help-body">
          <ol className="pcf-help-steps">
            {instructions.map((step, idx) => (
              <li key={idx} className="pcf-help-step">
                <span className="pcf-help-step-num">{idx + 1}</span>
                <span className="pcf-help-step-text">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREDENTIAL FIELD GROUPS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders a single password-type token input.
 * Used for: api_token, bearer_token, access_token, api_key, AND hmac.
 * The label adjusts based on auth_type so HMAC shows "API Key" instead of
 * "API Token / Key".
 */
function TokenCredFields({ register, errors, authType }) {
  const err     = errors?.cred_token?.message;
  const isHmac  = authType === 'hmac';
  const label   = isHmac ? 'API Key' : 'API Token / Key';
  const hint    = isHmac
    ? 'The API Key used to authenticate outbound calls to the CRM'
    : undefined;

  return (
    <Field label={label} required error={err} hint={hint}>
      <input
        {...register('cred_token')}
        type="password"
        autoComplete="new-password"
        placeholder="••••••••••••••••••••"
        className={`pcf-input pcf-secret${err ? ' has-err' : ''}`}
      />
    </Field>
  );
}

function BasicCredFields({ register, errors }) {
  return (
    <div className="pcf-g2">
      <Field label="Username" required error={errors?.cred_username?.message}>
        <input {...register('cred_username')} type="text" placeholder="admin_user" className={`pcf-input${errors?.cred_username ? ' has-err' : ''}`} />
      </Field>
      <Field label="Password" required error={errors?.cred_password?.message}>
        <input {...register('cred_password')} type="password" autoComplete="new-password" placeholder="••••••••" className={`pcf-input pcf-secret${errors?.cred_password ? ' has-err' : ''}`} />
      </Field>
    </div>
  );
}

function OAuth2CredFields({ register, errors }) {
  return (
    <>
      <Field label="Access Token" required error={errors?.cred_access_token?.message}>
        <input {...register('cred_access_token')} type="password" autoComplete="new-password" placeholder="••••••••••••••••••••" className={`pcf-input pcf-secret${errors?.cred_access_token ? ' has-err' : ''}`} />
      </Field>
      <div className="pcf-g2">
        <Field label="Refresh Token" optional>
          <input {...register('cred_refresh_token')} type="password" autoComplete="new-password" placeholder="••••••••••••••" className="pcf-input pcf-secret" />
        </Field>
        <Field label="Token Type" optional hint='Default: "Bearer"'>
          <input {...register('cred_token_type')} type="text" placeholder="Bearer" className="pcf-input" />
        </Field>
        <Field label="Client ID" optional>
          <input {...register('cred_client_id')} type="text" placeholder="client_id" className="pcf-input" />
        </Field>
        <Field label="Client Secret" optional>
          <input {...register('cred_client_secret')} type="password" autoComplete="new-password" placeholder="••••••••" className="pcf-input pcf-secret" />
        </Field>
      </div>
      <Field label="Expires At" optional hint="Unix timestamp — leave blank for non-expiring tokens" error={errors?.cred_expires_at?.message}>
        <input {...register('cred_expires_at')} type="number" placeholder="1893456000" className="pcf-input" />
      </Field>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WEBHOOK COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function WebhookShared({ register, errors, crmType }) {
  return (
    <div className="pcf-wh-box">
      <p className="pcf-wh-box-title">
        <svg width="12" height="12" fill="none" viewBox="0 0 16 16">
          <path d="M2 12c0-2 1.5-3.5 3.5-4L9 4.5M14 4c0 2-1.5 3.5-3.5 4L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Webhook — Shared Secret
      </p>
      <CopyableField crmType={crmType} label="Webhook Endpoint URL" hint="Copy and paste this URL into your CRM webhook configuration" />
      <Field label="Shared Webhook Secret" required error={errors?.webhook_secret?.message}>
        <input {...register('webhook_secret')} type="password" autoComplete="new-password" placeholder="••••••••••••••••" className={`pcf-input pcf-secret${errors?.webhook_secret ? ' has-err' : ''}`} />
      </Field>
      <span className="pcf-hint">
        Your CRM will send this secret in a header (e.g., <code>X-Hub-Signature</code>) for all webhook events.
      </span>
    </div>
  );
}

function WebhookPerEvent({ register, control, errors, crmType }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'per_event_secrets' });

  return (
    <div className="pcf-wh-box">
      <p className="pcf-wh-box-title">
        <svg width="12" height="12" fill="none" viewBox="0 0 16 16">
          <path d="M2 12c0-2 1.5-3.5 3.5-4L9 4.5M14 4c0 2-1.5 3.5-3.5 4L7 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Webhooks — Per-Event Secrets
      </p>
      <CopyableField crmType={crmType} label="Webhook Endpoint URL" hint="Copy and paste this URL into your CRM webhook configuration" />
      <span className="pcf-hint">This system supports different secrets per event type. Add one row per event.</span>
      {fields.length > 0 && (
        <div className="pcf-kv-list">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)' }}>Event</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t2)' }}>Secret</span>
            <span />
          </div>
          {fields.map((f, i) => {
            const rowErrs = errors?.per_event_secrets?.[i];
            return (
              <div key={f.id} className="pcf-kv-row">
                <input {...register(`per_event_secrets.${i}.event`)} type="text" placeholder="e.g., Lead.create" className={`pcf-input${rowErrs?.event ? ' has-err' : ''}`} />
                <input {...register(`per_event_secrets.${i}.secret`)} type="password" autoComplete="new-password" placeholder="secret" className={`pcf-input pcf-secret${rowErrs?.secret ? ' has-err' : ''}`} />
                <button type="button" className="pcf-kv-del" onClick={() => remove(i)} aria-label="Remove row">×</button>
              </div>
            );
          })}
        </div>
      )}
      <button type="button" className="pcf-add-row" onClick={() => append({ event: '', secret: '' })}>
        <PlusSVG /> Add Event Secret
      </button>
      <ErrMsg msg={typeof errors?.per_event_secrets?.message === 'string' ? errors.per_event_secrets.message : errors?.per_event_secrets?.root?.message} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1: CRM SELECTION GRID
// ─────────────────────────────────────────────────────────────────────────────

function PageSelectCrm({ availableCrms, onSelectCrm, onClose, modal }) {
  return (
    <>
      <Breadcrumb step="SELECT_CRM" />
      <div className="pcf-hdr">
        <div className="pcf-hdr-l">
          <div className="pcf-ico">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <h2 className="pcf-ttl">Provision Integrations</h2>
            <p className="pcf-sub">Select a CRM system to configure</p>
          </div>
        </div>
        {modal && (
          <button className="pcf-close" type="button" onClick={onClose} aria-label="Close">
            <svg width="13" height="13" fill="none" viewBox="0 0 16 16">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      <div className="pcf-body">
        <div className="pcf-sec">
          <p className="pcf-sec-lbl">Available CRM Systems</p>
          {availableCrms.length === 0 ? (
            <div className="pcf-alert pcf-alert--ok">
              <span className="pcf-alert-ico">✓</span>
              <div>
                <strong>All integrations provisioned</strong>
                <br />
                <span style={{ fontSize: 11, opacity: 0.85 }}>
                  Every available CRM has been configured for this tenant.
                </span>
              </div>
            </div>
          ) : (
            <div className="pcf-crm-grid">
              {availableCrms.map((crm) => (
                <button key={crm.value} type="button" className="pcf-crm-card" onClick={() => onSelectCrm(crm.value)}>
                  <div className="pcf-crm-card-body">
                    <span className="pcf-crm-card-name">{crm.label}</span>
                    <span className="pcf-crm-card-desc">{crm.description}</span>
                    <div className="pcf-crm-card-tags">
                      {crm.supportedAuthTypes.map((at) => (
                        <span key={at.value} className="pcf-crm-tag">{at.label}</span>
                      ))}
                      <span className="pcf-crm-tag" style={{ color: 'var(--warn)', borderColor: 'rgba(234,88,12,.3)', background: 'rgba(234,88,12,.08)' }}>
                        Webhooks
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {modal && (
        <div className="pcf-ftr">
          <button className="pcf-btn-cancel" type="button" onClick={onClose}>Close</button>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2: CONFIGURATION FORM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Auth types that render the single-token credential field.
 * 'hmac' is included because EspoCRM HMAC only requires the outbound API Key —
 * the secret key is used internally for request signing and isn't stored here.
 * The payload transform maps cred_token → credentials.api_token for hmac.
 */
const TOKEN_LIKE_RENDER = new Set([
  'api_token',
  'bearer_token',
  'access_token',
  'api_key',
  'hmac',  // ← outbound API key for HMAC auth (see HmacCredentials.api_token)
]);

function PageConfigureCrm({ activeCrm, onBack, onSuccess, onClose, modal }) {
  const crmConfig = MOCK_CRM_CONFIGS.find((c) => c.value === activeCrm);

  // ── Local state: only tracks success for the auto-redirect timer ─────────
  const [successData, setSuccessData] = useState(null);

  // ── React Query mutation ──────────────────────────────────────────────────
  const provisionMutation = useProvisionIntegration({
    onSuccess: (responseData) => {
      setSuccessData(responseData);
      setTimeout(() => {
        onSuccess?.(responseData);
        onBack();
      }, 1500);
    },
  });

  const isSubmitting = provisionMutation.isPending;
  const apiError     = provisionMutation.error?.message ?? null;
  const failedChecks = provisionMutation.error?.failedChecks ?? null; // string[] | null
  const errorStatus  = provisionMutation.error?.status ?? null;

  // ── Form ─────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(crmEntrySchema),
    defaultValues: makeCrmEntry(activeCrm),
  });

  const authType = watch('auth_type');
  const enableWh = watch('enable_webhooks');

  const helpInstructions        = crmConfig.instructions?.[authType] ?? null;
  const webhookHelpInstructions = crmConfig.webhookInstructions ?? null;

  // ── Submit ───────────────────────────────────────────────────────────────
  const onSubmit = (formValues) => {
    // Inject the CRM's webhook model so the service builds the right payload
    const enrichedValues = { ...formValues, _webhookModel: crmConfig.webhookModel };
    const payload = transformFormToPayload(enrichedValues);
    provisionMutation.mutate(payload);
  };

  if (!crmConfig) return null;

  return (
    <>
      <Breadcrumb step="CONFIGURE_CRM" />

      <div className="pcf-hdr">
        <div className="pcf-hdr-l">
          <button
            type="button"
            className="pcf-hdr-back"
            onClick={onBack}
            disabled={isSubmitting}
            aria-label="Go back"
            title="Back to CRM selection"
          >
            <BackArrowSVG />
          </button>
          <div className="pcf-ico">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <h2 className="pcf-ttl">Configure {crmConfig.label}</h2>
            <p className="pcf-sub">Set up your integration credentials</p>
          </div>
        </div>
        {modal && (
          <button className="pcf-close" type="button" onClick={onClose} aria-label="Close" disabled={isSubmitting}>
            <svg width="13" height="13" fill="none" viewBox="0 0 16 16">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="pcf-body">

          {/* ── Success banner ─────────────────────────────────────────── */}
          {successData && (
            <div className="pcf-alert pcf-alert--ok">
              <span className="pcf-alert-ico">✓</span>
              <div>
                <strong>{crmConfig.label} provisioned successfully!</strong>
                <br />
                <span style={{ fontSize: 11, color: 'inherit', opacity: 0.85 }}>
                  Integration ID:{' '}
                  <code style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 10 }}>
                    {successData.integration_id}
                  </code>
                  {' '}— redirecting…
                </span>
              </div>
            </div>
          )}

          {/* ── API error banner ───────────────────────────────────────── */}
          {apiError && !successData && (
            <div className="pcf-alert pcf-alert--err">
              <span className="pcf-alert-ico">!</span>
              <div>
                <strong>
                  {errorStatus === 403 ? 'Insufficient permissions' : 'Provisioning failed'}
                </strong>
                <br />
                {apiError}
                {/* ── Permission failed-checks list (403 only) ──────── */}
                {failedChecks && failedChecks.length > 0 && (
                  <ul className="pcf-failed-checks">
                    {failedChecks.map((check, idx) => (
                      <li key={idx} className="pcf-failed-check-item">{check}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* ── CRM-rejected-credentials hint (502 only) ───────────────── */}
          {errorStatus === 502 && !successData && (
            <div className="pcf-alert pcf-alert--warn" style={{ marginTop: -8 }}>
              <span className="pcf-alert-ico">⚠</span>
              <div style={{ fontSize: 12 }}>
                The CRM rejected the credentials after saving. Verify that the token
                has the required permissions and that the base URL is correct.
              </div>
            </div>
          )}

          {/* ── Form (hidden after success) ────────────────────────────── */}
          {!successData && (
            <div className="pcf-cfg-form">

              {/* Base URL */}
              <Field
                label="Instance Base URL"
                required
                hint={`Tenant-specific ${crmConfig.label} URL`}
                error={errors.base_url?.message}
              >
                <input
                  {...register('base_url')}
                  type="url"
                  placeholder={crmConfig.defaultBaseUrl}
                  className={`pcf-input${errors.base_url ? ' has-err' : ''}`}
                />
              </Field>

              {/* Auth type radio group */}
              <div>
                <p className="pcf-lbl" style={{ marginBottom: 10 }}>
                  Primary Auth Method <span className="pcf-req">*</span>
                </p>
                <div className="pcf-radio-group">
                  {crmConfig.supportedAuthTypes.map((at) => {
                    const selected = authType === at.value;
                    return (
                      <label
                        key={at.value}
                        className={`pcf-radio-item${selected ? ' pcf-radio-item--selected' : ''}`}
                      >
                        <input
                          type="radio"
                          value={at.value}
                          checked={selected}
                          onChange={() => setValue('auth_type', at.value, { shouldValidate: true })}
                        />
                        <div className="pcf-radio-dot">
                          <div className="pcf-radio-dot-inner" />
                        </div>
                        <span className="pcf-radio-icon">{at.icon}</span>
                        <span className="pcf-radio-label">{at.label}</span>
                      </label>
                    );
                  })}
                </div>
                <ErrMsg msg={errors.auth_type?.message} />
              </div>

              {/* Help box for auth method */}
              {helpInstructions && (
                <HelpBox instructions={helpInstructions} title="How to get this credential" />
              )}

              {/* Credential fields — rendered for every supported auth_type */}
              {authType && (
                <div className="pcf-cred-sub">
                  {/* Token-like types AND hmac all use the same single-token input */}
                  {TOKEN_LIKE_RENDER.has(authType) && (
                    <TokenCredFields register={register} errors={errors} authType={authType} />
                  )}
                  {authType === 'basic_auth' && (
                    <BasicCredFields register={register} errors={errors} />
                  )}
                  {authType === 'oauth2' && (
                    <OAuth2CredFields register={register} errors={errors} />
                  )}
                </div>
              )}

              {/* Webhook toggle + fields */}
              <div>
                <div className="pcf-wh-toggle-row">
                  <div className="pcf-wh-toggle-info">
                    <span className="pcf-wh-toggle-title">Enable Webhook Support</span>
                    <span className="pcf-wh-toggle-desc">
                      {crmConfig.webhookModel === 'shared'
                        ? 'Configure a shared secret for all inbound webhook events (Zammad-style)'
                        : 'Configure per-event secrets for inbound webhooks (EspoCRM-style)'}
                    </span>
                  </div>
                  <div className="pcf-toggle-wrap">
                    <label className="pcf-toggle">
                      <input type="checkbox" {...register('enable_webhooks')} />
                      <span className="pcf-toggle-track" />
                      <span className="pcf-toggle-thumb" />
                    </label>
                  </div>
                </div>

                {enableWh && crmConfig.webhookModel === 'shared' && (
                  <div style={{ marginTop: 14 }}>
                    <WebhookShared register={register} errors={errors} crmType={activeCrm} />
                    {webhookHelpInstructions && (
                      <div style={{ marginTop: 14 }}>
                        <HelpBox instructions={webhookHelpInstructions} title={`${crmConfig.label} Webhook Setup`} />
                      </div>
                    )}
                  </div>
                )}

                {enableWh && crmConfig.webhookModel === 'per_event' && (
                  <div style={{ marginTop: 14 }}>
                    <WebhookPerEvent register={register} control={control} errors={errors} crmType={activeCrm} />
                    {webhookHelpInstructions && (
                      <div style={{ marginTop: 14 }}>
                        <HelpBox instructions={webhookHelpInstructions} title={`${crmConfig.label} Webhook Setup`} />
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pcf-cfg-footer">
          <button type="button" className="pcf-btn-cancel" onClick={onBack} disabled={isSubmitting}>
            Back
          </button>
          {!successData && (
            <button className="pcf-btn-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="pcf-spinner" />
                  Provisioning…
                </>
              ) : (
                <>
                  <PlusSVG />
                  Provision {crmConfig.label}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT — Wizard State Management
// ─────────────────────────────────────────────────────────────────────────────

export default function ProvisionCredentialsForm({ onSuccess, onClose, modal = true }) {
  const [step, setStep]                   = useState('SELECT_CRM');
  const [activeCrm, setActiveCrm]         = useState(null);
  const [provisionedCrms, setProvisionedCrms] = useState([]);

  const availableCrms = MOCK_CRM_CONFIGS.filter(
    (crm) => !provisionedCrms.includes(crm.value)
  );

  const handleSelectCrm = (crmValue) => {
    setActiveCrm(crmValue);
    setStep('CONFIGURE_CRM');
  };

  const handleBackToCrmSelection = () => {
    setActiveCrm(null);
    setStep('SELECT_CRM');
  };

  const handleProvisionSuccess = (response) => {
    setProvisionedCrms((prev) => [...prev, response.crm_type]);
    onSuccess?.(response);
  };

  const handleClose = () => {
    setStep('SELECT_CRM');
    setActiveCrm(null);
    setProvisionedCrms([]);
    onClose?.();
  };

  const content =
    step === 'SELECT_CRM' ? (
      <PageSelectCrm
        availableCrms={availableCrms}
        onSelectCrm={handleSelectCrm}
        onClose={handleClose}
        modal={modal}
      />
    ) : (
      <PageConfigureCrm
        activeCrm={activeCrm}
        onBack={handleBackToCrmSelection}
        onSuccess={handleProvisionSuccess}
        onClose={handleClose}
        modal={modal}
      />
    );

  return (
    <div className="pcf">
      {modal ? (
        <div
          className="pcf-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Provision Integrations"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="pcf-panel pcf-panel--modal">{content}</div>
        </div>
      ) : (
        <div className="pcf-panel pcf-panel--card">{content}</div>
      )}
    </div>
  );
}