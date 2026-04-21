/**
 * ProvisionCredentialsForm.jsx
 *
 * CRM Credentials provisioning form for the Unified CRM Ticket Dashboard.
 * Self-contained component with inline CSS (no Tailwind).
 *
 * ── Dependencies ────────────────────────────────────────────────────────
 *   npm install react-hook-form zod @hookform/resolvers
 *
 * ── Usage: Modal (recommended) ─────────────────────────────────────────
 *   const [open, setOpen] = useState(false);
 *   {open && (
 *     <ProvisionCredentialsForm
 *       modal={true}
 *       onClose={() => setOpen(false)}
 *       onSuccess={(data) => console.log('Integration ID:', data.integration_id)}
 *     />
 *   )}
 *
 * ── Props ───────────────────────────────────────────────────────────────
 *   modal     boolean   Wrap in overlay/modal (default: true)
 *   onClose   fn        Called when user dismisses modal
 *   onSuccess fn(data)  Called with API response on success
 *   apiBase   string    Prefix before /api/v1/integrations/ (default: "")
 */

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// ZOD SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const apiTokenSchema = z.object({
  auth_type: z.enum(["api_token", "bearer_token", "access_token", "api_key"]),
  token: z.string().min(1, "Token is required"),
});

const basicAuthSchema = z.object({
  auth_type: z.literal("basic_auth"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const oauth2Schema = z.object({
  auth_type: z.literal("oauth2"),
  access_token: z.string().min(1, "Access token is required"),
  refresh_token: z.string().optional(),
  token_type: z.string().default("Bearer"),
  expires_at: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().int().positive().nullable().optional()
  ),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
});

const hmacSchema = z
  .object({
    auth_type: z.literal("hmac"),
    api_token: z.string().optional(),
    webhook_secret: z.string().optional(),
    per_event_secrets: z
      .array(
        z.object({
          event: z.string().min(1, "Event key required"),
          secret: z.string().min(1, "Secret required"),
        })
      )
      .optional(),
  })
  .refine(
    (d) =>
      d.api_token ||
      d.webhook_secret ||
      (d.per_event_secrets && d.per_event_secrets.length > 0),
    {
      message:
        "At least one of api_token, webhook_secret, or per_event_secrets is required",
      path: ["api_token"],
    }
  );

const credentialsUnion = z.discriminatedUnion("auth_type", [
  apiTokenSchema,
  basicAuthSchema,
  oauth2Schema,
  hmacSchema,
]);

const formSchema = z.object({
  crm_type: z.string().min(1, "CRM type is required"),
  base_url: z
    .string()
    .min(1, "Base URL is required")
    .url("Must be a valid URL (include https://)"),
  auth_type: z.enum([
    "api_token",
    "bearer_token",
    "access_token",
    "api_key",
    "basic_auth",
    "oauth2",
    "hmac",
  ]),
  credentials: credentialsUnion,
  extra_metadata: z.record(z.any()).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CRM_OPTIONS = [
  { value: "zammad", label: "Zammad" },
  { value: "espocrm", label: "EspoCRM" },
  { value: "salesforce", label: "Salesforce" },
  { value: "hubspot", label: "HubSpot" },
  { value: "zoho", label: "Zoho CRM" },
  { value: "freshdesk", label: "Freshdesk" },
];

const AUTH_OPTIONS = [
  { value: "api_token", label: "API Token" },
  { value: "bearer_token", label: "Bearer Token" },
  { value: "access_token", label: "Access Token" },
  { value: "api_key", label: "API Key" },
  { value: "basic_auth", label: "Basic Auth (Username / Password)" },
  { value: "oauth2", label: "OAuth 2.0" },
  { value: "hmac", label: "HMAC / Webhook Secret" },
];

const AUTH_LABELS = {
  api_token: "API Token",
  bearer_token: "Bearer Token",
  access_token: "Access Token",
  api_key: "API Key",
  basic_auth: "Basic Auth",
  oauth2: "OAuth 2.0",
  hmac: "HMAC / Webhook",
};

const CRED_DEFAULTS = {
  api_token: { auth_type: "api_token", token: "" },
  bearer_token: { auth_type: "bearer_token", token: "" },
  access_token: { auth_type: "access_token", token: "" },
  api_key: { auth_type: "api_key", token: "" },
  basic_auth: { auth_type: "basic_auth", username: "", password: "" },
  oauth2: {
    auth_type: "oauth2",
    access_token: "",
    refresh_token: "",
    token_type: "Bearer",
    expires_at: "",
    client_id: "",
    client_secret: "",
  },
  hmac: {
    auth_type: "hmac",
    api_token: "",
    webhook_secret: "",
    per_event_secrets: [],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// INLINE CSS (Responsive, matches dashboard design system)
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');

.pcf {
  --p:        #2563EB;
  --ph:       #1D4ED8;
  --plt:      #EFF6FF;
  --pring:    rgba(37,99,235,.12);
  --ok:       #10B981;
  --oklt:     #ECFDF5;
  --err:      #EF4444;
  --errlt:    #FEF2F2;
  --t1:       #060D1F;
  --t2:       #2D3748;
  --tm:       #64748B;
  --bd:       #C8D3DF;
  --bg:       #F1F5F9;
  --card:     #FFFFFF;
  --rsm:      6px;
  --rmd:      10px;
  --rlg:      14px;
  --ring:     0 0 0 3px var(--pring);
  --tr:       150ms cubic-bezier(0.4,0,0.2,1);
  --shadow:   0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  
  font-family: 'Sora', system-ui, -apple-system, sans-serif;
  color: var(--t1);
}
.pcf *, .pcf *::before, .pcf *::after { box-sizing: border-box; }

/* overlay */
.pcf-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6,13,31,0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: pcf-fade 0.18s ease;
}

/* panel */
.pcf-panel {
  background: var(--card);
  border-radius: var(--rlg);
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  max-height: 92vh;
  overflow: hidden;
}

.pcf-panel--modal {
  box-shadow: var(--shadow);
  animation: pcf-up 0.22s ease;
}

/* header */
.pcf-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}

.pcf-hdr-l {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pcf-ico {
  width: 2.375rem;
  height: 2.375rem;
  border-radius: var(--rmd);
  background: var(--plt);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pcf-ico svg {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--p);
}

.pcf-ttl {
  font-size: 0.9375rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.015em;
  line-height: 1.4;
}

.pcf-sub {
  font-size: 0.75rem;
  color: var(--t2);
  margin: 0.125rem 0 0;
}

.pcf-close {
  width: 1.875rem;
  height: 1.875rem;
  border-radius: var(--rsm);
  border: 1px solid var(--bd);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--t2);
  transition: all var(--tr);
  flex-shrink: 0;
}

.pcf-close:hover {
  background: var(--bg);
  color: var(--t1);
}

/* body */
.pcf-body {
  overflow-y: auto;
  padding: 1.375rem 1.75rem;
  flex: 1;
}

.pcf-body::-webkit-scrollbar {
  width: 6px;
}

.pcf-body::-webkit-scrollbar-track {
  background: transparent;
}

.pcf-body::-webkit-scrollbar-thumb {
  background: var(--bd);
  border-radius: 3px;
}

/* section */
.pcf-sec {
  margin-bottom: 1.375rem;
}

.pcf-sec-lbl {
  font-size: 0.65625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--tm);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.875rem;
}

.pcf-sec-lbl::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--bd);
}

/* grid */
.pcf-g2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.875rem;
}

.pcf-full {
  grid-column: 1 / -1;
}

/* field */
.pcf-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pcf-lbl {
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3125rem;
}

.pcf-req {
  color: var(--err);
  font-size: 0.625rem;
}

.pcf-opt {
  font-size: 0.625rem;
  font-weight: 500;
  color: var(--tm);
  background: var(--bg);
  border: 1px solid var(--bd);
  border-radius: 4px;
  padding: 0.0625rem 0.3125rem;
}

.pcf-hint {
  font-size: 0.6875rem;
  color: var(--tm);
}

.pcf-errmsg {
  font-size: 0.6875rem;
  color: var(--err);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* inputs */
.pcf-input,
.pcf-select {
  height: 2.375rem;
  padding: 0 0.6875rem;
  border: 1px solid var(--bd);
  border-radius: var(--rsm);
  background: var(--card);
  color: var(--t1);
  font-size: 0.8125rem;
  font-family: inherit;
  outline: none;
  width: 100%;
  transition: border-color var(--tr), box-shadow var(--tr);
  -webkit-appearance: none;
  appearance: none;
}

.pcf-input:focus,
.pcf-select:focus {
  border-color: var(--p);
  box-shadow: var(--ring);
}

.pcf-input.has-err,
.pcf-select.has-err {
  border-color: var(--err);
  box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
}

.pcf-select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2364748B' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.625rem center;
  background-size: 1rem;
  padding-right: 1.875rem;
  cursor: pointer;
}

.pcf-secret {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 0.78125rem;
  letter-spacing: 0.05em;
}

.pcf-secret::placeholder {
  font-family: inherit;
  font-size: 0.8125rem;
  letter-spacing: 0;
}

/* cred box */
.pcf-cred-box {
  background: var(--bg);
  border: 1px solid var(--bd);
  border-radius: var(--rmd);
  padding: 1.125rem;
  animation: pcf-fade 0.2s ease;
}

.pcf-cred-stack {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

/* auth badge */
.pcf-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--p);
  background: var(--plt);
  border: 1px solid rgba(37,99,235,0.2);
  border-radius: 20px;
  padding: 0.1875rem 0.625rem;
  margin-bottom: 0.875rem;
}

/* HMAC kv rows */
.pcf-kv-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.pcf-kv-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.875rem;
  gap: 0.4375rem;
  align-items: center;
}

.pcf-kv-del {
  width: 1.875rem;
  height: 1.875rem;
  border-radius: var(--rsm);
  border: 1px solid var(--bd);
  background: transparent;
  color: var(--err);
  font-size: 1.125rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--tr);
  flex-shrink: 0;
}

.pcf-kv-del:hover {
  background: var(--errlt);
  border-color: var(--err);
}

.pcf-add-row {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: var(--rsm);
  border: 1px dashed var(--p);
  background: var(--plt);
  color: var(--p);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--tr);
  font-family: inherit;
  width: 100%;
}

.pcf-add-row:hover {
  background: rgba(37,99,235,0.08);
}

/* alerts */
.pcf-alert {
  border-radius: var(--rmd);
  padding: 0.875rem 1rem;
  font-size: 0.8125rem;
  line-height: 1.6;
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  margin-bottom: 1.125rem;
}

.pcf-alert--ok {
  background: var(--oklt);
  border: 1px solid rgba(16,185,129,0.25);
  color: #065F46;
}

.pcf-alert--err {
  background: var(--errlt);
  border: 1px solid rgba(239,68,68,0.25);
  color: #7F1D1D;
}

.pcf-alert-ico {
  flex-shrink: 0;
  font-size: 0.9375rem;
  margin-top: 0.125rem;
  font-weight: 700;
}

.pcf-id-pill {
  display: inline-block;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 0.6875rem;
  background: rgba(16,185,129,0.12);
  border: 1px solid rgba(16,185,129,0.3);
  border-radius: 4px;
  padding: 0.125rem 0.375rem;
  margin-top: 0.25rem;
}

/* footer */
.pcf-ftr {
  padding: 0.875rem 1.75rem 1.25rem;
  border-top: 1px solid var(--bd);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.625rem;
  flex-shrink: 0;
}

.pcf-btn-cancel {
  height: 2.375rem;
  padding: 0 1.125rem;
  border-radius: var(--rsm);
  border: 1px solid var(--bd);
  background: transparent;
  color: var(--t2);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all var(--tr);
}

.pcf-btn-cancel:hover {
  background: var(--bg);
  color: var(--t1);
}

.pcf-btn-submit {
  height: 2.375rem;
  padding: 0 1.375rem;
  border-radius: var(--rsm);
  border: none;
  background: var(--p);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all var(--tr);
  letter-spacing: -0.01em;
}

.pcf-btn-submit:hover:not(:disabled) {
  background: var(--ph);
  transform: translateY(-0.0625rem);
  box-shadow: 0 4px 12px rgba(37,99,235,0.3);
}

.pcf-btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pcf-spinner {
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: pcf-spin 0.7s linear infinite;
}

/* keyframes */
@keyframes pcf-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pcf-up {
  from {
    opacity: 0;
    transform: translateY(1.125rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pcf-spin {
  to { transform: rotate(360deg); }
}

/* responsive */
@media (max-width: 37.5rem) {
  .pcf-panel {
    border-radius: 0;
    max-height: 100vh;
  }

  .pcf-g2 {
    grid-template-columns: 1fr;
  }

  .pcf-hdr,
  .pcf-body,
  .pcf-ftr {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .pcf-hdr {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function ErrMsg({ msg }) {
  if (!msg) return null;
  return (
    <span className="pcf-errmsg">
      <svg width="11" height="11" fill="none" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 5v3.5M8 11h.01"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      {msg}
    </span>
  );
}

function Field({ label, required, optional, hint, error, children }) {
  return (
    <div className="pcf-field">
      <label className="pcf-lbl">
        {label}
        {required && <span className="pcf-req">*</span>}
        {optional && <span className="pcf-opt">optional</span>}
      </label>
      {children}
      {hint && !error && <span className="pcf-hint">{hint}</span>}
      <ErrMsg msg={error} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREDENTIAL FIELD GROUPS
// ─────────────────────────────────────────────────────────────────────────────

function TokenFields({ register, errors, authType }) {
  const labels = {
    api_token: "API Token",
    bearer_token: "Bearer Token",
    access_token: "Access Token",
    api_key: "API Key",
  };
  return (
    <Field
      label={labels[authType] ?? "Token"}
      required
      error={errors?.credentials?.token?.message}
    >
      <input
        {...register("credentials.token")}
        type="password"
        autoComplete="new-password"
        placeholder="••••••••••••••••••••"
        className={`pcf-input pcf-secret${
          errors?.credentials?.token ? " has-err" : ""
        }`}
      />
    </Field>
  );
}

function BasicFields({ register, errors }) {
  return (
    <div className="pcf-g2">
      <Field
        label="Username"
        required
        error={errors?.credentials?.username?.message}
      >
        <input
          {...register("credentials.username")}
          type="text"
          placeholder="admin_user"
          className={`pcf-input${
            errors?.credentials?.username ? " has-err" : ""
          }`}
        />
      </Field>
      <Field
        label="Password"
        required
        error={errors?.credentials?.password?.message}
      >
        <input
          {...register("credentials.password")}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className={`pcf-input pcf-secret${
            errors?.credentials?.password ? " has-err" : ""
          }`}
        />
      </Field>
    </div>
  );
}

function OAuth2Fields({ register, errors }) {
  return (
    <div className="pcf-cred-stack">
      <Field
        label="Access Token"
        required
        error={errors?.credentials?.access_token?.message}
      >
        <input
          {...register("credentials.access_token")}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••••••••••"
          className={`pcf-input pcf-secret${
            errors?.credentials?.access_token ? " has-err" : ""
          }`}
        />
      </Field>
      <div className="pcf-g2">
        <Field label="Refresh Token" optional>
          <input
            {...register("credentials.refresh_token")}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••••••"
            className="pcf-input pcf-secret"
          />
        </Field>
        <Field label="Token Type" optional hint='Default: "Bearer"'>
          <input
            {...register("credentials.token_type")}
            type="text"
            placeholder="Bearer"
            className="pcf-input"
          />
        </Field>
        <Field label="Client ID" optional>
          <input
            {...register("credentials.client_id")}
            type="text"
            placeholder="client_id"
            className="pcf-input"
          />
        </Field>
        <Field label="Client Secret" optional>
          <input
            {...register("credentials.client_secret")}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="pcf-input pcf-secret"
          />
        </Field>
      </div>
      <Field
        label="Expires At"
        optional
        hint="Unix timestamp — leave blank for non-expiring tokens"
        error={errors?.credentials?.expires_at?.message}
      >
        <input
          {...register("credentials.expires_at")}
          type="number"
          placeholder="1893456000"
          className="pcf-input"
        />
      </Field>
    </div>
  );
}

function HmacFields({ register, control, errors }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "credentials.per_event_secrets",
  });
  return (
    <div className="pcf-cred-stack">
      <Field
        label="API Token"
        optional
        hint="For outbound CRM API calls"
        error={errors?.credentials?.api_token?.message}
      >
        <input
          {...register("credentials.api_token")}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••••••"
          className="pcf-input pcf-secret"
        />
      </Field>
      <Field
        label="Webhook Secret"
        optional
        hint="Shared secret for all inbound webhook events"
      >
        <input
          {...register("credentials.webhook_secret")}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••••••"
          className="pcf-input pcf-secret"
        />
      </Field>
      <div className="pcf-field">
        <label className="pcf-lbl">
          Per-Event Secrets <span className="pcf-opt">optional</span>
        </label>
        <span className="pcf-hint" style={{ marginBottom: "0.375rem" }}>
          Map event names → individual webhook secrets (EspoCRM-style)
        </span>
        {fields.length > 0 && (
          <div className="pcf-kv-list">
            {fields.map((f, i) => (
              <div key={f.id} className="pcf-kv-row">
                <input
                  {...register(`credentials.per_event_secrets.${i}.event`)}
                  type="text"
                  placeholder="Case.create"
                  className={`pcf-input${
                    errors?.credentials?.per_event_secrets?.[i]?.event
                      ? " has-err"
                      : ""
                  }`}
                />
                <input
                  {...register(
                    `credentials.per_event_secrets.${i}.secret`
                  )}
                  type="password"
                  autoComplete="new-password"
                  placeholder="secret"
                  className={`pcf-input pcf-secret${
                    errors?.credentials?.per_event_secrets?.[i]?.secret
                      ? " has-err"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  className="pcf-kv-del"
                  onClick={() => remove(i)}
                  aria-label={`Remove row ${i + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          className="pcf-add-row"
          onClick={() => append({ event: "", secret: "" })}
        >
          <svg width="11" height="11" fill="none" viewBox="0 0 14 14">
            <path
              d="M7 1v12M1 7h12"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
          Add Event Secret
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function ProvisionCredentialsForm({
  onSuccess,
  onClose,
  modal = true,
  apiBase = "",
}) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [apiErr, setApiErr] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crm_type: "",
      base_url: "",
      auth_type: "api_token",
      credentials: CRED_DEFAULTS.api_token,
      extra_metadata: {},
    },
  });

  const authType = watch("auth_type");

  // When auth_type changes, reset the credential sub-object to avoid stale fields
  useEffect(() => {
    reset(
      (prev) => ({
        ...prev,
        auth_type: authType,
        credentials: CRED_DEFAULTS[authType] ?? CRED_DEFAULTS.api_token,
      }),
      { keepValues: false }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authType]);

  const handleClose = () => {
    reset();
    setSuccess(null);
    setApiErr(null);
    onClose?.();
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setApiErr(null);
    setSuccess(null);

    // Build credentials: strip empty optional values; flatten kv array → object for hmac
    const creds = { ...data.credentials };
    if (creds.auth_type === "hmac" && Array.isArray(creds.per_event_secrets)) {
      const kvObj = {};
      creds.per_event_secrets.forEach(({ event, secret }) => {
        if (event) kvObj[event] = secret;
      });
      creds.per_event_secrets = kvObj;
    }
    Object.keys(creds).forEach((k) => {
      if (creds[k] === "" || creds[k] == null) delete creds[k];
    });

    const payload = {
      crm_type: data.crm_type,
      base_url: data.base_url,
      credentials: creds,
      extra_metadata: data.extra_metadata ?? {},
    };

    try {
      const res = await fetch(`${apiBase}/api/v1/integrations/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail = json?.detail ?? json?.message ?? `HTTP ${res.status}`;
        setApiErr(
          typeof detail === "string" ? detail : JSON.stringify(detail, null, 2)
        );
        return;
      }

      setSuccess(json);
      onSuccess?.(json);
    } catch (err) {
      setApiErr(err?.message ?? "Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isTokenLike = [
    "api_token",
    "bearer_token",
    "access_token",
    "api_key",
  ].includes(authType);

  const content = (
    <>
      {/* Header */}
      <div className="pcf-hdr">
        <div className="pcf-hdr-l">
          <div className="pcf-ico">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <div>
            <h2 className="pcf-ttl">Provision CRM Integration</h2>
            <p className="pcf-sub">
              Configure credentials for a new CRM connection
            </p>
          </div>
        </div>
        {modal && (
          <button
            className="pcf-close"
            type="button"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 16 16">
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="pcf-body">
        {success && (
          <div className="pcf-alert pcf-alert--ok">
            <span className="pcf-alert-ico">✓</span>
            <div>
              <strong>Integration provisioned successfully!</strong>
              <br />
              Integration ID:&nbsp;
              <span className="pcf-id-pill">{success.integration_id}</span>
              <br />
              <span style={{ fontSize: "0.6875rem", display: "block", marginTop: "0.25rem" }}>
                {success.crm_type} · {success.auth_type} · {success.base_url}
              </span>
            </div>
          </div>
        )}

        {apiErr && (
          <div className="pcf-alert pcf-alert--err">
            <span className="pcf-alert-ico">!</span>
            <div>
              <strong>Provisioning failed</strong>
              <br />
              {apiErr}
            </div>
          </div>
        )}

        <form id="pcf-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* ─ Integration Details ─ */}
          <div className="pcf-sec">
            <p className="pcf-sec-lbl">Integration Details</p>
            <div className="pcf-g2">
              <Field
                label="CRM Type"
                required
                error={errors.crm_type?.message}
              >
                <select
                  {...register("crm_type")}
                  className={`pcf-select${errors.crm_type ? " has-err" : ""}`}
                >
                  <option value="">Select CRM…</option>
                  {CRM_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Auth Type"
                required
                error={errors.auth_type?.message}
              >
                <select
                  {...register("auth_type")}
                  className={`pcf-select${errors.auth_type ? " has-err" : ""}`}
                >
                  {AUTH_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="pcf-full">
                <Field
                  label="Base URL"
                  required
                  hint="Tenant-specific CRM instance URL"
                  error={errors.base_url?.message}
                >
                  <input
                    {...register("base_url")}
                    type="url"
                    placeholder="https://crm.yourcompany.com"
                    className={`pcf-input${errors.base_url ? " has-err" : ""}`}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* ─ Credentials ─ */}
          <div className="pcf-sec">
            <p className="pcf-sec-lbl">Credentials</p>
            <div className="pcf-cred-box">
              <div className="pcf-badge">
                <svg width="11" height="11" fill="none" viewBox="0 0 16 16">
                  <path
                    d="M8 1a4 4 0 014 4v1h1a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1h1V5a4 4 0 014-4z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                {AUTH_LABELS[authType] ?? authType}
              </div>

              {isTokenLike && (
                <TokenFields
                  register={register}
                  errors={errors}
                  authType={authType}
                />
              )}
              {authType === "basic_auth" && (
                <BasicFields register={register} errors={errors} />
              )}
              {authType === "oauth2" && (
                <OAuth2Fields register={register} errors={errors} />
              )}
              {authType === "hmac" && (
                <HmacFields register={register} control={control} errors={errors} />
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="pcf-ftr">
        {modal && (
          <button
            className="pcf-btn-cancel"
            type="button"
            onClick={handleClose}
          >
            Cancel
          </button>
        )}
        <button
          className="pcf-btn-submit"
          type="button"
          disabled={submitting}
          onClick={handleSubmit(onSubmit)}
        >
          {submitting ? (
            <>
              <span className="pcf-spinner" />
              Provisioning…
            </>
          ) : (
            <>
              <svg width="13" height="13" fill="none" viewBox="0 0 14 14">
                <path
                  d="M7 1v12M1 7h12"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
              Provision Integration
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="pcf">
      <style>{CSS}</style>
      {modal ? (
        <div
          className="pcf-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Provision CRM Integration"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="pcf-panel pcf-panel--modal">{content}</div>
        </div>
      ) : (
        <div className="pcf-panel">{content}</div>
      )}
    </div>
  );
}