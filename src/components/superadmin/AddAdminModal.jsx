import { useState, useEffect, useCallback } from 'react';
import { X, Shield, Mail, User, Building2, Loader2, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

export default function AddAdminModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm]           = useState(EMPTY_FORM);
  const [tenants, setTenants]     = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [tenantsError, setTenantsError]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState({});
  const [apiError, setApiError]     = useState('');
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied]             = useState(false);

  const fetchTenants = useCallback(async (signal) => {
    setLoadingTenants(true);
    setTenantsError('');
    try {
      const data = await superAdminService.getTenants();
      if (signal?.aborted) return;
      setTenants(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (err) {
      if (signal?.aborted) return;
      console.error('Failed to load tenants:', err);
      setTenantsError('Could not load tenants. Please try again.');
    } finally {
      if (!signal?.aborted) setLoadingTenants(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    fetchTenants(controller.signal);
    return () => controller.abort();
  }, [isOpen, fetchTenants]);

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setApiError('');
      setTenantsError('');
      setInviteResult(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function validate() {
    const e = {};
    if (!form.tenant_id)           e.tenant_id   = 'Please select a tenant.';
    if (!form.admin_name.trim())   e.admin_name  = 'Admin full name is required.';
    if (!form.admin_email.trim())  e.admin_email = 'Admin email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.admin_email)) e.admin_email = 'Enter a valid email.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setApiError('');
    try {
      const result = await superAdminService.inviteAdmin({
        tenant_id:   form.tenant_id,
        admin_name:  form.admin_name.trim(),
        admin_email: form.admin_email.trim(),
      });
      onSubmit(result);
      setInviteResult(result); // show success screen
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function field(key, value) {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteResult.invite_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      document.getElementById('invite-link-input')?.select();
    }
  }

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.modal} role="dialog" aria-modal="true" aria-labelledby="add-admin-title">

        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={s.iconBox}><Shield size={18} color="white" /></div>
            <div>
              <h2 id="add-admin-title" style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                {inviteResult ? 'Invite Created' : 'Invite Admin'}
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
                {inviteResult ? `For ${inviteResult.tenant?.name}` : 'Send an invitation to a tenant admin'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={s.closeBtn} aria-label="Close"><X size={18} /></button>
        </div>

        {inviteResult ? (
          <SuccessView result={inviteResult} copied={copied} onCopy={copyLink} onClose={onClose} />
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ padding: '24px 24px 0' }}>
              {apiError && <div style={s.errorBanner} role="alert">{apiError}</div>}

              <div style={{ marginBottom: 18 }}>
                <label style={s.label}>Tenant (Organization) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <TenantSelect
                  loading={loadingTenants} error={tenantsError} tenants={tenants}
                  value={form.tenant_id} onChange={val => field('tenant_id', val)}
                  hasFieldError={!!errors.tenant_id} onRetry={() => fetchTenants()}
                />
                {errors.tenant_id  && <p role="alert" style={s.fieldError}>{errors.tenant_id}</p>}
                {!errors.tenant_id && !tenantsError && <p style={s.hint}>Select which organization this admin belongs to</p>}
              </div>

              <Field label="Admin Full Name" required error={errors.admin_name}>
                <div style={s.inputWrap}>
                  <User size={15} style={s.inputIcon} />
                  <input style={{ ...s.input, paddingLeft: 36, borderColor: errors.admin_name ? 'var(--danger)' : undefined }}
                    placeholder="e.g. John Anderson" value={form.admin_name}
                    onChange={e => field('admin_name', e.target.value)} autoFocus />
                </div>
              </Field>

              <Field label="Admin Email" required error={errors.admin_email} hint="An invite link will be sent to this address">
                <div style={s.inputWrap}>
                  <Mail size={15} style={s.inputIcon} />
                  <input type="email" style={{ ...s.input, paddingLeft: 36, borderColor: errors.admin_email ? 'var(--danger)' : undefined }}
                    placeholder="admin@company.com" value={form.admin_email}
                    onChange={e => field('admin_email', e.target.value)} />
                </div>
              </Field>

              <div style={s.infoNote}>
                <Shield size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>A single-use invite link will be generated and sent to the admin's email. It grants access to their tenant's portal only.</span>
              </div>
            </div>

            <div style={s.footer}>
              <button type="button" onClick={onClose} style={s.cancelBtn} disabled={submitting}>Cancel</button>
              <button type="submit" style={s.submitBtn} disabled={submitting || loadingTenants}>
                {submitting ? <><Loader2 size={14} style={s.spin} /> Sending…</> : 'Send Invite'}
              </button>
            </div>
          </form>
        )}
      </div>
      <style>{GLOBAL_STYLES}</style>
    </div>
  );
}

// ── Success view ──────────────────────────────────────────────────────────────

function SuccessView({ result, copied, onCopy, onClose }) {
  return (
    <div style={{ padding: 24 }}>
      <div style={s.successBadge}>
        <div style={s.successIcon}><Check size={22} color="white" strokeWidth={2.5} /></div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#166534' }}>Invite created successfully</p>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#16a34a' }}>
            Expires in 24 hours · Share this link with <strong>{result.admin_email}</strong>
          </p>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <label style={{ ...s.label, marginBottom: 8 }}>
          🔗 Invite Link
          <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 11.5, marginLeft: 6 }}>(development only)</span>
        </label>
        <div style={s.linkBox}>
          <input id="invite-link-input" readOnly value={result.invite_link}
            style={s.linkInput} onFocus={e => e.target.select()} />
          <button onClick={onCopy} style={{ ...s.copyBtn, ...(copied ? s.copyBtnSuccess : {}) }} title="Copy to clipboard">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <a href={result.invite_link} target="_blank" rel="noreferrer" style={s.openLink}>
          <ExternalLink size={12} /> Open in new tab
        </a>
      </div>

      <div style={s.detailsGrid}>
        <DetailRow label="Admin Email" value={result.admin_email} />
        <DetailRow label="Tenant"      value={result.tenant?.name} />
        <DetailRow label="Expires"     value="24 hours from now" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button onClick={onClose} style={s.submitBtn}>Done</button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={s.detailRow}>
      <span style={s.detailLabel}>{label}</span>
      <span style={s.detailValue}>{value}</span>
    </div>
  );
}

function TenantSelect({ loading, error, tenants, value, onChange, hasFieldError, onRetry }) {
  if (loading) return (
    <div style={{ ...s.input, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
      <Loader2 size={14} style={s.spin} /> Loading tenants…
    </div>
  );
  if (error) return (
    <div style={s.inlineError} role="alert">
      <span>{error}</span>
      <button type="button" onClick={onRetry} style={s.retryBtn}><RefreshCw size={12} /> Retry</button>
    </div>
  );
  return (
    <div style={{ position: 'relative' }}>
      <Building2 size={15} style={{ ...s.inputIcon, pointerEvents: 'none' }} />
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...s.input, paddingLeft: 36, appearance: 'none', cursor: 'pointer', borderColor: hasFieldError ? 'var(--danger)' : undefined }}>
        <option value="">Select a tenant…</option>
        {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

function Field({ label, required, error, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={s.label}>{label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
      {children}
      {hint  && !error && <p style={s.hint}>{hint}</p>}
      {error && <p role="alert" style={s.fieldError}>{error}</p>}
    </div>
  );
}

const EMPTY_FORM    = { tenant_id: '', admin_name: '', admin_email: '' };
const GLOBAL_STYLES = `@keyframes spin { to { transform: rotate(360deg); } }`;

const s = {
  overlay:        { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal:          { background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: 480, border: '1px solid var(--border)' },
  header:         { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' },
  iconBox:        { width: 38, height: 38, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  closeBtn:       { background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' },
  inputWrap:      { position: 'relative' },
  inputIcon:      { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' },
  input:          { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', fontSize: 13.5, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  label:          { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' },
  hint:           { fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 },
  fieldError:     { fontSize: 11.5, color: 'var(--danger)', marginTop: 4 },
  footer:         { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border)', marginTop: 8 },
  cancelBtn:      { padding: '9px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-secondary)' },
  submitBtn:      { padding: '9px 20px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 },
  errorBanner:    { marginBottom: 16, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#DC2626' },
  inlineError:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#DC2626' },
  retryBtn:       { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #FECACA', borderRadius: 6, background: 'white', color: '#DC2626', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  infoNote:       { display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 14px', marginBottom: 16, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-sm)', fontSize: 12.5, color: 'var(--primary)', lineHeight: 1.5 },
  spin:           { animation: 'spin 1s linear infinite' },
  successBadge:   { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 'var(--radius-sm)' },
  successIcon:    { width: 40, height: 40, borderRadius: '50%', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  linkBox:        { display: 'flex', gap: 8, alignItems: 'center' },
  linkInput:      { flex: 1, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#F8FAFC', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace', outline: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', boxSizing: 'border-box', minWidth: 0 },
  copyBtn:        { display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 },
  copyBtnSuccess: { background: '#F0FDF4', borderColor: '#86EFAC', color: '#166534' },
  openLink:       { display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 12, color: 'var(--primary)', textDecoration: 'none', opacity: 0.8 },
  detailsGrid:    { marginTop: 20, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' },
  detailRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, lastChild: { borderBottom: 'none' } },
  detailLabel:    { color: 'var(--text-muted)', fontWeight: 500 },
  detailValue:    { color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};