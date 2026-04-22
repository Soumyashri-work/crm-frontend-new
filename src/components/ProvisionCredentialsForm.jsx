/**
 * ProvisionCredentialsForm.jsx  — DEMO / MOCK MODE
 *
 * Unified CRM Ticket Dashboard · Credential Provisioning Form
 * ──────────────────────────────────────────────────────────────────────────────
 * Changes from v1
 *  • MOCK_CRM_CONFIGS  — hardcoded schema driving all CRM/auth options
 *  • CRM select filters available auth types per CRM (schema-driven)
 *  • auth_types is now a multi-select via styled checkboxes (array, not string)
 *  • Multiple selected auth types stack their field groups simultaneously
 *  • onSubmit does console.log(payload) + triggers success UI (no fetch)
 *
 * Dependencies: react-hook-form  zod  @hookform/resolvers
 */

import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK BACKEND SCHEMA
// Replace / extend this array to match your real backend's capabilities.
// Each CRM defines:
//   supportedAuthTypes  – which auth methods the CRM accepts
//   defaultBaseUrl      – pre-filled placeholder for the Base URL field
//   description         – short blurb shown in the CRM selector
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_CRM_CONFIGS = [
  {
    value: "zammad",
    label: "Zammad",
    description: "Open-source helpdesk & ticketing",
    defaultBaseUrl: "https://support.yourcompany.com",
    supportedAuthTypes: ["api_token", "basic_auth", "hmac"],
  },
  {
    value: "espocrm",
    label: "EspoCRM",
    description: "Self-hosted CRM platform",
    defaultBaseUrl: "https://crm.yourcompany.com",
    supportedAuthTypes: ["api_key", "basic_auth", "hmac", "oauth2"],
  },
  {
    value: "salesforce",
    label: "Salesforce",
    description: "Enterprise cloud CRM",
    defaultBaseUrl: "https://yourorg.my.salesforce.com",
    supportedAuthTypes: ["oauth2", "bearer_token"],
  },
  {
    value: "hubspot",
    label: "HubSpot",
    description: "Inbound marketing & CRM suite",
    defaultBaseUrl: "https://api.hubapi.com",
    supportedAuthTypes: ["api_key", "oauth2", "bearer_token"],
  },
  {
    value: "zoho",
    label: "Zoho CRM",
    description: "Multi-channel CRM platform",
    defaultBaseUrl: "https://www.zohoapis.com/crm/v3",
    supportedAuthTypes: ["oauth2", "access_token"],
  },
  {
    value: "freshdesk",
    label: "Freshdesk",
    description: "Cloud-based customer support",
    defaultBaseUrl: "https://yoursubdomain.freshdesk.com",
    supportedAuthTypes: ["api_key", "basic_auth"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AUTH TYPE METADATA  (label + icon letter for badges)
// ─────────────────────────────────────────────────────────────────────────────

const AUTH_META = {
  api_token:    { label: "API Token",               icon: "T" },
  bearer_token: { label: "Bearer Token",            icon: "B" },
  access_token: { label: "Access Token",            icon: "A" },
  api_key:      { label: "API Key",                 icon: "K" },
  basic_auth:   { label: "Basic Auth",              icon: "U" },
  oauth2:       { label: "OAuth 2.0",               icon: "O" },
  hmac:         { label: "HMAC / Webhook",          icon: "H" },
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT CREDENTIAL OBJECTS  (one per auth type)
// ─────────────────────────────────────────────────────────────────────────────

const CRED_DEFAULTS = {
  api_token:    { auth_type: "api_token",    token: "" },
  bearer_token: { auth_type: "bearer_token", token: "" },
  access_token: { auth_type: "access_token", token: "" },
  api_key:      { auth_type: "api_key",      token: "" },
  basic_auth:   { auth_type: "basic_auth",   username: "", password: "" },
  oauth2: {
    auth_type: "oauth2",
    access_token: "", refresh_token: "",
    token_type: "Bearer", expires_at: "",
    client_id: "", client_secret: "",
  },
  hmac: { auth_type: "hmac", api_token: "", webhook_secret: "", per_event_secrets: [] },
};

// ─────────────────────────────────────────────────────────────────────────────
// ZOD SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const tokenLikeSchema = z.object({
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
      .array(z.object({
        event: z.string().min(1, "Event key required"),
        secret: z.string().min(1, "Secret required"),
      }))
      .optional(),
  })
  .refine(
    (d) => d.api_token || d.webhook_secret || (d.per_event_secrets?.length ?? 0) > 0,
    { message: "At least one of api_token, webhook_secret, or per_event_secrets is required", path: ["api_token"] }
  );

// Per-auth credential schema (used inside the array)
const singleCredentialSchema = z.discriminatedUnion("auth_type", [
  tokenLikeSchema,
  basicAuthSchema,
  oauth2Schema,
  hmacSchema,
]);

const formSchema = z.object({
  crm_type:    z.string().min(1, "CRM type is required"),
  base_url:    z.string().min(1, "Base URL is required").url("Must be a valid URL (include https://)"),
  auth_types:  z.array(z.string()).min(1, "Select at least one auth method"),
  // credentials is a record keyed by auth_type string
  credentials: z.record(singleCredentialSchema),
  extra_metadata: z.record(z.any()).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// INLINE CSS  (design system preserved + new checkbox / stacked panel styles)
// ─────────────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

.pcf {
  --p:        #4f6ef7;
  --ph:       #3a5be0;
  --plt:      #eef1fe;
  --pring:    rgba(79,110,247,.18);
  --ok:       #22c55e;
  --oklt:     #f0fdf4;
  --err:      #ef4444;
  --errlt:    #fef2f2;
  --warn:     #f59e0b;
  --warnlt:   #fffbeb;
  --t1:       #111827;
  --t2:       #6b7280;
  --tm:       #9ca3af;
  --bd:       #e5e7eb;
  --bg:       #f9fafb;
  --card:     #ffffff;
  --rsm:      6px;
  --rmd:      10px;
  --rlg:      14px;
  --ring:     0 0 0 3px var(--pring);
  --tr:       150ms cubic-bezier(.4,0,.2,1);
  --shadow:   0 20px 60px rgba(0,0,0,.18), 0 4px 24px rgba(0,0,0,.09);
  font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
  color: var(--t1);
}
.pcf *, .pcf *::before, .pcf *::after { box-sizing: border-box; }

/* ── overlay ── */
.pcf-overlay {
  position: fixed; inset: 0;
  background: rgba(15,18,35,.48);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
  animation: pcf-fade .18s ease;
}

/* ── panel ── */
.pcf-panel {
  background: var(--card);
  border-radius: var(--rlg);
  width: 100%; max-width: 660px;
  display: flex; flex-direction: column;
}
.pcf-panel--modal {
  box-shadow: var(--shadow);
  max-height: 92vh;
  animation: pcf-up .22s ease;
}
.pcf-panel--card {
  border: 1px solid var(--bd);
  box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
  margin: 0 auto;
}

/* ── header ── */
.pcf-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 26px 18px; border-bottom: 1px solid var(--bd);
  flex-shrink: 0;
}
.pcf-hdr-l { display: flex; align-items: center; gap: 12px; }
.pcf-ico {
  width: 38px; height: 38px; border-radius: var(--rmd);
  background: var(--plt); display: flex; align-items: center; justify-content: center;
}
.pcf-ico svg { width: 20px; height: 20px; color: var(--p); }
.pcf-ttl { font-size: 15px; font-weight: 700; margin: 0; letter-spacing: -.02em; }
.pcf-sub { font-size: 12px; color: var(--t2); margin: 2px 0 0; }
.pcf-close {
  width: 30px; height: 30px; border-radius: var(--rsm);
  border: 1px solid var(--bd); background: transparent;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: var(--t2); transition: all var(--tr); flex-shrink: 0;
}
.pcf-close:hover { background: var(--bg); color: var(--t1); }

/* ── body ── */
.pcf-body { overflow-y: auto; padding: 22px 26px; flex: 1; }

/* ── section ── */
.pcf-sec { margin-bottom: 22px; }
.pcf-sec-lbl {
  font-size: 10.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .08em; color: var(--tm);
  display: flex; align-items: center; gap: 8px; margin: 0 0 14px;
}
.pcf-sec-lbl::after { content:''; flex:1; height:1px; background:var(--bd); }

/* ── grid ── */
.pcf-g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.pcf-full { grid-column: 1 / -1; }

/* ── field ── */
.pcf-field { display: flex; flex-direction: column; gap: 4px; }
.pcf-lbl { font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 5px; }
.pcf-req { color: var(--err); font-size: 10px; }
.pcf-opt {
  font-size: 10px; font-weight: 500; color: var(--tm);
  background: var(--bg); border: 1px solid var(--bd);
  border-radius: 4px; padding: 1px 5px;
}
.pcf-hint { font-size: 11px; color: var(--tm); }
.pcf-errmsg { font-size: 11px; color: var(--err); display: flex; align-items: center; gap: 4px; }

/* ── CRM selector card grid ── */
.pcf-crm-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.pcf-crm-card {
  border: 1.5px solid var(--bd);
  border-radius: var(--rmd);
  padding: 11px 12px;
  cursor: pointer;
  transition: all var(--tr);
  background: var(--card);
  text-align: left;
  display: flex; flex-direction: column; gap: 2px;
  position: relative;
  outline: none;
}
.pcf-crm-card:hover { border-color: var(--p); background: var(--plt); }
.pcf-crm-card--active {
  border-color: var(--p);
  background: var(--plt);
  box-shadow: var(--ring);
}
.pcf-crm-card-name { font-size: 12.5px; font-weight: 700; color: var(--t1); }
.pcf-crm-card-desc { font-size: 10.5px; color: var(--t2); line-height: 1.35; }
.pcf-crm-check {
  position: absolute; top: 7px; right: 7px;
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--p); display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity var(--tr);
}
.pcf-crm-card--active .pcf-crm-check { opacity: 1; }
.pcf-crm-check svg { width: 9px; height: 9px; color: #fff; }

/* ── inputs ── */
.pcf-input, .pcf-select {
  height: 38px; padding: 0 11px;
  border: 1px solid var(--bd); border-radius: var(--rsm);
  background: var(--card); color: var(--t1);
  font-size: 13px; font-family: inherit;
  outline: none; width: 100%;
  transition: border-color var(--tr), box-shadow var(--tr);
  -webkit-appearance: none; appearance: none;
}
.pcf-input:focus, .pcf-select:focus { border-color: var(--p); box-shadow: var(--ring); }
.pcf-input.has-err, .pcf-select.has-err {
  border-color: var(--err); box-shadow: 0 0 0 3px rgba(239,68,68,.1);
}
.pcf-select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center; background-size: 16px;
  padding-right: 30px; cursor: pointer;
}
.pcf-secret {
  font-family: 'JetBrains Mono','Fira Code',monospace;
  font-size: 12.5px; letter-spacing: .04em;
}
.pcf-secret::placeholder { font-family: inherit; font-size: 13px; letter-spacing: 0; }

/* ── auth type checkbox grid ── */
.pcf-auth-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 7px;
}
.pcf-auth-cb {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border: 1.5px solid var(--bd);
  border-radius: var(--rmd);
  cursor: pointer;
  transition: all var(--tr);
  user-select: none;
  background: var(--card);
}
.pcf-auth-cb:hover { border-color: var(--p); background: var(--plt); }
.pcf-auth-cb--checked {
  border-color: var(--p);
  background: var(--plt);
}
/* hide native checkbox */
.pcf-auth-cb input[type="checkbox"] { display: none; }
/* custom checkbox box */
.pcf-cb-box {
  width: 17px; height: 17px; flex-shrink: 0;
  border: 1.5px solid var(--bd);
  border-radius: 4px;
  background: var(--card);
  display: flex; align-items: center; justify-content: center;
  transition: all var(--tr);
}
.pcf-auth-cb--checked .pcf-cb-box {
  background: var(--p); border-color: var(--p);
}
.pcf-cb-box svg { width: 10px; height: 10px; color: #fff; opacity: 0; transition: opacity var(--tr); }
.pcf-auth-cb--checked .pcf-cb-box svg { opacity: 1; }
/* icon letter */
.pcf-cb-icon {
  width: 26px; height: 26px; border-radius: var(--rsm);
  background: var(--bg); border: 1px solid var(--bd);
  font-size: 11px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  color: var(--t2); flex-shrink: 0;
  transition: all var(--tr);
}
.pcf-auth-cb--checked .pcf-cb-icon {
  background: rgba(79,110,247,.12); border-color: rgba(79,110,247,.25); color: var(--p);
}
.pcf-cb-label { font-size: 12.5px; font-weight: 600; color: var(--t1); flex: 1; }
.pcf-auth-none {
  font-size: 12px; color: var(--tm); font-style: italic;
  padding: 12px; text-align: center;
  border: 1px dashed var(--bd); border-radius: var(--rmd);
}

/* ── stacked credential panels ── */
.pcf-cred-stack-outer {
  display: flex; flex-direction: column; gap: 12px;
}
.pcf-cred-panel {
  border: 1.5px solid var(--bd);
  border-radius: var(--rmd);
  overflow: hidden;
  animation: pcf-fade .22s ease;
}
.pcf-cred-panel-hdr {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  background: var(--bg);
  border-bottom: 1px solid var(--bd);
}
.pcf-cred-panel-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--p); flex-shrink: 0;
}
.pcf-cred-panel-title { font-size: 12px; font-weight: 700; color: var(--t1); flex: 1; }
.pcf-cred-panel-badge {
  font-size: 10px; font-weight: 700;
  color: var(--p); background: var(--plt);
  border: 1px solid rgba(79,110,247,.2);
  border-radius: 20px; padding: 2px 8px; letter-spacing: .02em;
}
.pcf-cred-panel-body { padding: 16px 14px; display: flex; flex-direction: column; gap: 14px; }

/* ── HMAC kv rows ── */
.pcf-kv-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.pcf-kv-row { display: grid; grid-template-columns: 1fr 1fr 30px; gap: 7px; align-items: center; }
.pcf-kv-del {
  width: 30px; height: 30px; border-radius: var(--rsm);
  border: 1px solid var(--bd); background: transparent;
  color: var(--err); font-size: 18px; line-height: 1;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all var(--tr);
}
.pcf-kv-del:hover { background: var(--errlt); border-color: var(--err); }
.pcf-add-row {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: var(--rsm);
  border: 1px dashed var(--p); background: var(--plt);
  color: var(--p); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all var(--tr); font-family: inherit;
}
.pcf-add-row:hover { background: rgba(79,110,247,.14); }

/* ── empty state ── */
.pcf-cred-empty {
  text-align: center; padding: 28px 20px;
  border: 1.5px dashed var(--bd); border-radius: var(--rmd);
  color: var(--tm); font-size: 13px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.pcf-cred-empty-icon {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--bg); border: 1px solid var(--bd);
  display: flex; align-items: center; justify-content: center;
}
.pcf-cred-empty-icon svg { width: 16px; height: 16px; color: var(--tm); }

/* ── alerts ── */
.pcf-alert {
  border-radius: var(--rmd); padding: 14px 16px;
  font-size: 13px; line-height: 1.55;
  display: flex; align-items: flex-start; gap: 10px; margin-bottom: 18px;
}
.pcf-alert--ok  { background: var(--oklt);  border: 1px solid rgba(34,197,94,.25);  color: #166534; }
.pcf-alert--err { background: var(--errlt); border: 1px solid rgba(239,68,68,.25);  color: #991b1b; }
.pcf-alert-ico { flex-shrink: 0; font-size: 15px; margin-top: 2px; }
.pcf-id-pill {
  display: inline-block;
  font-family: 'JetBrains Mono','Fira Code',monospace;
  font-size: 11px; background: rgba(34,197,94,.12);
  border: 1px solid rgba(34,197,94,.3); border-radius: 4px; padding: 2px 6px; margin-top: 4px;
}
/* success payload pre */
.pcf-payload-pre {
  margin: 8px 0 0;
  padding: 10px 12px;
  background: rgba(34,197,94,.06);
  border: 1px solid rgba(34,197,94,.18);
  border-radius: var(--rsm);
  font-family: 'JetBrains Mono','Fira Code',monospace;
  font-size: 10.5px;
  color: #166534;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 160px;
  overflow-y: auto;
}

/* ── footer ── */
.pcf-ftr {
  padding: 14px 26px 20px;
  border-top: 1px solid var(--bd);
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  flex-shrink: 0;
}
.pcf-ftr-right { display: flex; align-items: center; gap: 10px; }
.pcf-ftr-hint { font-size: 11px; color: var(--tm); }
.pcf-btn-cancel {
  height: 38px; padding: 0 18px; border-radius: var(--rsm);
  border: 1px solid var(--bd); background: transparent;
  color: var(--t2); font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: all var(--tr);
}
.pcf-btn-cancel:hover { background: var(--bg); color: var(--t1); }
.pcf-btn-submit {
  height: 38px; padding: 0 22px; border-radius: var(--rsm);
  border: none; background: var(--p);
  color: #fff; font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  display: flex; align-items: center; gap: 8px;
  transition: all var(--tr); letter-spacing: -.01em;
}
.pcf-btn-submit:hover:not(:disabled) {
  background: var(--ph);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(79,110,247,.38);
}
.pcf-btn-submit:disabled { opacity: .6; cursor: not-allowed; }
.pcf-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.35); border-top-color: #fff;
  border-radius: 50%; animation: pcf-spin .7s linear infinite;
}

/* ── keyframes ── */
@keyframes pcf-fade { from{opacity:0} to{opacity:1} }
@keyframes pcf-up   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes pcf-spin { to{transform:rotate(360deg)} }

/* ── responsive ── */
@media(max-width:620px){
  .pcf-panel--modal { max-height:100vh; border-radius:0; }
  .pcf-hdr,.pcf-body,.pcf-ftr { padding-left:16px; padding-right:16px; }
  .pcf-g2 { grid-template-columns:1fr; }
  .pcf-crm-grid { grid-template-columns: repeat(2,1fr); }
  .pcf-auth-grid { grid-template-columns: 1fr; }
  .pcf-kv-row { grid-template-columns: 1fr 1fr 30px; }
}
@media(max-width:380px){
  .pcf-crm-grid { grid-template-columns: 1fr; }
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ErrMsg({ msg }) {
  if (!msg) return null;
  return (
    <span className="pcf-errmsg">
      <svg width="11" height="11" fill="none" viewBox="0 0 16 16">
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

const CheckIcon = () => (
  <svg fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="2">
    <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// CREDENTIAL FIELD GROUPS  (one component per auth type)
// Each receives a `prefix` like "credentials.api_token" for namespaced fields.
// ─────────────────────────────────────────────────────────────────────────────

function TokenFields({ register, errors, authType, prefix }) {
  const labels = {
    api_token: "API Token", bearer_token: "Bearer Token",
    access_token: "Access Token", api_key: "API Key",
  };
  const err = errors?.credentials?.[authType]?.token?.message;
  return (
    <Field label={labels[authType] ?? "Token"} required error={err}>
      <input
        {...register(`${prefix}.token`)}
        type="password"
        autoComplete="new-password"
        placeholder="••••••••••••••••••••"
        className={`pcf-input pcf-secret${err ? " has-err" : ""}`}
      />
    </Field>
  );
}

function BasicFields({ register, errors, authType, prefix }) {
  const errs = errors?.credentials?.[authType];
  return (
    <div className="pcf-g2">
      <Field label="Username" required error={errs?.username?.message}>
        <input
          {...register(`${prefix}.username`)}
          type="text"
          placeholder="admin_user"
          className={`pcf-input${errs?.username ? " has-err" : ""}`}
        />
      </Field>
      <Field label="Password" required error={errs?.password?.message}>
        <input
          {...register(`${prefix}.password`)}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className={`pcf-input pcf-secret${errs?.password ? " has-err" : ""}`}
        />
      </Field>
    </div>
  );
}

function OAuth2Fields({ register, errors, authType, prefix }) {
  const errs = errors?.credentials?.[authType];
  return (
    <>
      <Field label="Access Token" required error={errs?.access_token?.message}>
        <input
          {...register(`${prefix}.access_token`)}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••••••••••"
          className={`pcf-input pcf-secret${errs?.access_token ? " has-err" : ""}`}
        />
      </Field>
      <div className="pcf-g2">
        <Field label="Refresh Token" optional>
          <input
            {...register(`${prefix}.refresh_token`)}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••••••"
            className="pcf-input pcf-secret"
          />
        </Field>
        <Field label="Token Type" optional hint='Default: "Bearer"'>
          <input {...register(`${prefix}.token_type`)} type="text" placeholder="Bearer" className="pcf-input" />
        </Field>
        <Field label="Client ID" optional>
          <input {...register(`${prefix}.client_id`)} type="text" placeholder="client_id" className="pcf-input" />
        </Field>
        <Field label="Client Secret" optional>
          <input
            {...register(`${prefix}.client_secret`)}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="pcf-input pcf-secret"
          />
        </Field>
      </div>
      <Field label="Expires At" optional hint="Unix timestamp — leave blank for non-expiring tokens" error={errs?.expires_at?.message}>
        <input {...register(`${prefix}.expires_at`)} type="number" placeholder="1893456000" className="pcf-input" />
      </Field>
    </>
  );
}

function HmacFields({ register, control, errors, authType, prefix }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${prefix}.per_event_secrets`,
  });
  const errs = errors?.credentials?.[authType];
  return (
    <>
      <Field label="API Token" optional hint="For outbound CRM API calls" error={errs?.api_token?.message}>
        <input
          {...register(`${prefix}.api_token`)}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••••••"
          className="pcf-input pcf-secret"
        />
      </Field>
      <Field label="Webhook Secret" optional hint="Shared secret for all inbound webhook events">
        <input
          {...register(`${prefix}.webhook_secret`)}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••••••"
          className="pcf-input pcf-secret"
        />
      </Field>
      <div className="pcf-field">
        <label className="pcf-lbl">Per-Event Secrets <span className="pcf-opt">optional</span></label>
        <span className="pcf-hint" style={{ marginBottom: 6 }}>Map event names → individual webhook secrets</span>
        {fields.length > 0 && (
          <div className="pcf-kv-list">
            {fields.map((f, i) => (
              <div key={f.id} className="pcf-kv-row">
                <input
                  {...register(`${prefix}.per_event_secrets.${i}.event`)}
                  type="text"
                  placeholder="Case.create"
                  className="pcf-input"
                />
                <input
                  {...register(`${prefix}.per_event_secrets.${i}.secret`)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="secret"
                  className="pcf-input pcf-secret"
                />
                <button type="button" className="pcf-kv-del" onClick={() => remove(i)} aria-label="Remove">×</button>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="pcf-add-row" onClick={() => append({ event: "", secret: "" })}>
          <svg width="11" height="11" fill="none" viewBox="0 0 14 14">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          Add Event Secret
        </button>
      </div>
    </>
  );
}

// Renders one credential panel for a given authType
function CredentialPanel({ authType, register, control, errors, index }) {
  const meta   = AUTH_META[authType] ?? { label: authType, icon: "?" };
  const prefix = `credentials.${authType}`;
  const isTokenLike = ["api_token", "bearer_token", "access_token", "api_key"].includes(authType);

  return (
    <div className="pcf-cred-panel">
      <div className="pcf-cred-panel-hdr">
        <div className="pcf-cred-panel-dot" />
        <span className="pcf-cred-panel-title">{meta.label} Credentials</span>
        <span className="pcf-cred-panel-badge">#{index + 1}</span>
      </div>
      <div className="pcf-cred-panel-body">
        {isTokenLike && (
          <TokenFields register={register} errors={errors} authType={authType} prefix={prefix} />
        )}
        {authType === "basic_auth" && (
          <BasicFields register={register} errors={errors} authType={authType} prefix={prefix} />
        )}
        {authType === "oauth2" && (
          <OAuth2Fields register={register} errors={errors} authType={authType} prefix={prefix} />
        )}
        {authType === "hmac" && (
          <HmacFields register={register} control={control} errors={errors} authType={authType} prefix={prefix} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ProvisionCredentialsForm({
  onSuccess,
  onClose,
  modal = true,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(null);   // mock payload shown on success
  const [apiErr, setApiErr]         = useState(null);

  // ── form setup ────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      crm_type:    "",
      base_url:    "",
      auth_types:  [],
      credentials: {},
      extra_metadata: {},
    },
  });

  const crmType   = watch("crm_type");
  const authTypes = watch("auth_types");   // string[]

  // Derive the selected CRM config object
  const selectedCrm = MOCK_CRM_CONFIGS.find((c) => c.value === crmType) ?? null;

  // When CRM changes → reset auth_types to [] and pre-fill base_url
  useEffect(() => {
    setValue("auth_types",  []);
    setValue("credentials", {});
    setValue("base_url", selectedCrm?.defaultBaseUrl ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crmType]);

  // When auth_types changes → add default credential objects for newly added types,
  // and remove objects for deselected types
  useEffect(() => {
    const current = authTypes ?? [];
    setValue("credentials", (prev) => {
      const next = {};
      current.forEach((at) => {
        // keep existing values; initialise if new
        next[at] = prev?.[at] ?? CRED_DEFAULTS[at] ?? {};
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(authTypes)]);

  // Toggle a single auth type in the array
  const toggleAuthType = useCallback((value) => {
    const current = authTypes ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setValue("auth_types", next, { shouldValidate: true });

    // Sync credentials object immediately
    setValue("credentials", (() => {
      const creds = {};
      next.forEach((at) => {
        const existing = watch(`credentials.${at}`);
        creds[at] = existing || CRED_DEFAULTS[at] || {};
      });
      return creds;
    })());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authTypes]);

  const handleClose = () => {
    reset();
    setSuccess(null);
    setApiErr(null);
    onClose?.();
  };

  // ── MOCK SUBMIT ──────────────────────────────────────────────────────────
  const onSubmit = (data) => {
    setSubmitting(true);
    setApiErr(null);
    setSuccess(null);

    // Build final credentials object: strip empty optional values; flatten HMAC kv array
    const finalCreds = {};
    (data.auth_types ?? []).forEach((at) => {
      const raw = { ...(data.credentials?.[at] ?? {}) };

      if (at === "hmac" && Array.isArray(raw.per_event_secrets)) {
        const kvObj = {};
        raw.per_event_secrets.forEach(({ event, secret }) => { if (event) kvObj[event] = secret; });
        raw.per_event_secrets = kvObj;
      }
      // Remove blank optional fields so payload is clean
      Object.keys(raw).forEach((k) => { if (raw[k] === "" || raw[k] == null) delete raw[k]; });

      finalCreds[at] = raw;
    });

    const payload = {
      crm_type:      data.crm_type,
      base_url:      data.base_url,
      auth_types:    data.auth_types,
      credentials:   finalCreds,
      extra_metadata: data.extra_metadata ?? {},
    };

    // ── MOCK: no fetch, just log + show success ──
    console.log("📦 [MOCK] Provision payload:", JSON.stringify(payload, null, 2));

    // Simulate a short network delay for realism
    setTimeout(() => {
      const mockResponse = {
        integration_id: `int_${Math.random().toString(36).slice(2, 10)}`,
        crm_type:   payload.crm_type,
        auth_types: payload.auth_types,
        base_url:   payload.base_url,
        is_active:  true,
        created_at: new Date().toISOString(),
        _mock_payload: payload,
      };
      setSuccess(mockResponse);
      setSubmitting(false);
      onSuccess?.(mockResponse);
    }, 700);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  const content = (
    <>
      {/* ── Header ── */}
      <div className="pcf-hdr">
        <div className="pcf-hdr-l">
          <div className="pcf-ico">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <h2 className="pcf-ttl">Provision CRM Integration</h2>
            <p className="pcf-sub"></p>
          </div>
        </div>
        {modal && (
          <button className="pcf-close" type="button" onClick={handleClose} aria-label="Close">
            <svg width="13" height="13" fill="none" viewBox="0 0 16 16">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div className="pcf-body">

        {/* Success banner */}
        {success && (
          <div className="pcf-alert pcf-alert--ok">
            <span className="pcf-alert-ico">✓</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>Integration provisioned! (mock)</strong>
              <br />
              ID: <span className="pcf-id-pill">{success.integration_id}</span>
              {" "}·{" "}{success.crm_type}
              {" "}·{" "}{success.auth_types?.join(", ")}
              <pre className="pcf-payload-pre">
                {JSON.stringify(success._mock_payload, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Error banner */}
        {apiErr && (
          <div className="pcf-alert pcf-alert--err">
            <span className="pcf-alert-ico">!</span>
            <div><strong>Error</strong><br />{apiErr}</div>
          </div>
        )}

        <form id="pcf-form" onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* ── Step 1: Select CRM ── */}
          <div className="pcf-sec">
            <p className="pcf-sec-lbl">1 · Select CRM</p>
            <div className="pcf-crm-grid">
              {MOCK_CRM_CONFIGS.map((crm) => (
                <button
                  key={crm.value}
                  type="button"
                  className={`pcf-crm-card${crmType === crm.value ? " pcf-crm-card--active" : ""}`}
                  onClick={() => setValue("crm_type", crm.value, { shouldValidate: true })}
                >
                  <span className="pcf-crm-card-name">{crm.label}</span>
                  <span className="pcf-crm-card-desc">{crm.description}</span>
                  <span className="pcf-crm-check">
                    <CheckIcon />
                  </span>
                </button>
              ))}
            </div>
            <ErrMsg msg={errors.crm_type?.message} />
          </div>

          {/* ── Step 2: Base URL (only after CRM chosen) ── */}
          {crmType && (
            <div className="pcf-sec">
              <p className="pcf-sec-lbl">2 · Instance URL</p>
              <Field
                label="Base URL"
                required
                hint={`Tenant-specific ${selectedCrm?.label ?? ""} instance URL`}
                error={errors.base_url?.message}
              >
                <input
                  {...register("base_url")}
                  type="url"
                  placeholder={selectedCrm?.defaultBaseUrl ?? "https://crm.yourcompany.com"}
                  className={`pcf-input${errors.base_url ? " has-err" : ""}`}
                />
              </Field>
            </div>
          )}

          {/* ── Step 3: Auth types (filtered by CRM) ── */}
          {crmType && (
            <div className="pcf-sec">
              <p className="pcf-sec-lbl">3 · Auth Methods</p>
              {selectedCrm ? (
                <>
                  <div className="pcf-auth-grid">
                    {selectedCrm.supportedAuthTypes.map((at) => {
                      const meta    = AUTH_META[at] ?? { label: at, icon: "?" };
                      const checked = (authTypes ?? []).includes(at);
                      return (
                        <label
                          key={at}
                          className={`pcf-auth-cb${checked ? " pcf-auth-cb--checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAuthType(at)}
                          />
                          <div className="pcf-cb-box"><CheckIcon /></div>
                          <span className="pcf-cb-icon">{meta.icon}</span>
                          <span className="pcf-cb-label">{meta.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <ErrMsg msg={errors.auth_types?.message} />
                  {(authTypes ?? []).length > 1 && (
                    <p style={{ fontSize: 11, color: "var(--t2)", marginTop: 8, marginBottom: 0 }}>
                      ✦ {authTypes.length} auth methods selected — credential fields are stacked below.
                    </p>
                  )}
                </>
              ) : (
                <div className="pcf-auth-none">Select a CRM first to see available auth methods.</div>
              )}
            </div>
          )}

          {/* ── Step 4: Stacked credential panels ── */}
          {(authTypes ?? []).length > 0 && (
            <div className="pcf-sec">
              <p className="pcf-sec-lbl">4 · Credentials</p>
              <div className="pcf-cred-stack-outer">
                {authTypes.map((at, idx) => (
                  <CredentialPanel
                    key={at}
                    authType={at}
                    index={idx}
                    register={register}
                    control={control}
                    errors={errors}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Prompt when no auth selected yet */}
          {crmType && (authTypes ?? []).length === 0 && (
            <div className="pcf-sec">
              <p className="pcf-sec-lbl">4 · Credentials</p>
              <div className="pcf-cred-empty">
                <div className="pcf-cred-empty-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span>Select at least one auth method above to see credential fields.</span>
              </div>
            </div>
          )}

        </form>
      </div>

      {/* ── Footer ── */}
      <div className="pcf-ftr">
        <span className="pcf-ftr-hint">
          {success
            ? "✓ Payload logged to console"
            : "Provide necessary details and click the button to provision."}
        </span>
        <div className="pcf-ftr-right">
          {modal && (
            <button className="pcf-btn-cancel" type="button" onClick={handleClose}>
              Cancel
            </button>
          )}
          <button
            className="pcf-btn-submit"
            type="button"
            disabled={submitting || !crmType || (authTypes ?? []).length === 0}
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
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
                Provision Integration
              </>
            )}
          </button>
        </div>
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
        <div className="pcf-panel pcf-panel--card">{content}</div>
      )}
    </div>
  );
}
