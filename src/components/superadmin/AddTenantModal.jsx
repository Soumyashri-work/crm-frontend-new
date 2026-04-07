import { useState, useEffect, useCallback } from 'react';
import { X, Building2, Mail, Globe, Loader2, RefreshCw } from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

/**
 * AddTenantModal
 *
 * Props:
 *   isOpen   {boolean}
 *   onClose  {() => void}
 *   onSubmit {(newTenant: object) => void}  – called with the server response
 */
export default function AddTenantModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm]           = useState(EMPTY_FORM);
  const [sourceSystems, setSourceSystems] = useState([]);
  const [loadingSystems, setLoadingSystems] = useState(false);
  const [systemsError, setSystemsError]    = useState('');   // separate from submit error
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState({});
  const [apiError, setApiError]     = useState('');

  // ── Fetch source systems ──────────────────────────────────────────────────
  const fetchSourceSystems = useCallback(async (signal) => {
    setLoadingSystems(true);
    setSystemsError('');
    try {
      const data = await superAdminService.getSourceSystems();
      if (signal?.aborted) return;
      setSourceSystems(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (err) {
      if (signal?.aborted) return;
      console.error('Failed to load source systems:', err);
      setSystemsError('Could not load source systems. Please try again.');
    } finally {
      if (!signal?.aborted) setLoadingSystems(false);
    }
  }, []);

  // Trigger fetch whenever modal opens; cancel on unmount / close
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    fetchSourceSystems(controller.signal);
    return () => controller.abort();
  }, [isOpen, fetchSourceSystems]);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setApiError('');
      setSystemsError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Validation ────────────────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!form.name.trim())         e.name             = 'Tenant name is required.';
    if (!form.email.trim())        e.email            = 'Contact email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.source_system_id)    e.source_system_id = 'Please select a source system.';
    return e;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError('');
    try {
      const tenant = await superAdminService.createTenant({
        name:             form.name.trim(),
        email:            form.email.trim(),
        source_system_id: Number(form.source_system_id),
      });
      onSubmit(tenant);
      onClose();
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.modal} role="dialog" aria-modal="true" aria-labelledby="add-tenant-title">

        {/* Header */}
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={s.iconBox}><Building2 size={18} color="white" /></div>
            <div>
              <h2 id="add-tenant-title" style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Add Tenant</h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>Onboard a new organization</p>
            </div>
          </div>
          <button onClick={onClose} style={s.closeBtn} aria-label="Close"><X size={18} /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ padding: '24px 24px 0' }}>

            {/* Submit-level API error */}
            {apiError && (
              <div style={s.errorBanner} role="alert">{apiError}</div>
            )}

            {/* Tenant Name */}
            <Field label="Tenant Name" required error={errors.name}>
              <div style={s.inputWrap}>
                <Building2 size={15} style={s.inputIcon} />
                <input
                  style={{ ...s.input, paddingLeft: 36, borderColor: errors.name ? 'var(--danger)' : undefined }}
                  placeholder="e.g. Global Industries Corp"
                  value={form.name}
                  onChange={e => field('name', e.target.value)}
                  autoFocus
                />
              </div>
            </Field>

            {/* Contact Email */}
            <Field label="Contact Email" required error={errors.email}>
              <div style={s.inputWrap}>
                <Mail size={15} style={s.inputIcon} />
                <input
                  type="email"
                  style={{ ...s.input, paddingLeft: 36, borderColor: errors.email ? 'var(--danger)' : undefined }}
                  placeholder="admin@company.com"
                  value={form.email}
                  onChange={e => field('email', e.target.value)}
                />
              </div>
            </Field>

            {/* Source System */}
            <Field
              label="Source / CRM System"
              required
              error={errors.source_system_id}
              hint="The CRM this tenant currently uses"
            >
              <SourceSystemSelect
                loading={loadingSystems}
                error={systemsError}
                systems={sourceSystems}
                value={form.source_system_id}
                onChange={val => field('source_system_id', val)}
                hasFieldError={!!errors.source_system_id}
                onRetry={() => fetchSourceSystems()}
              />
            </Field>

          </div>

          {/* Footer */}
          <div style={s.footer}>
            <button type="button" onClick={onClose} style={s.cancelBtn} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" style={s.submitBtn} disabled={submitting || loadingSystems}>
              {submitting
                ? <><Loader2 size={14} style={s.spin} /> Adding…</>
                : 'Add Tenant'
              }
            </button>
          </div>
        </form>
      </div>
      <style>{GLOBAL_STYLES}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SourceSystemSelect({ loading, error, systems, value, onChange, hasFieldError, onRetry }) {
  if (loading) {
    return (
      <div style={{ ...s.input, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
        <Loader2 size={14} style={s.spin} />
        Loading systems…
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.inlineError} role="alert">
        <span>{error}</span>
        <button type="button" onClick={onRetry} style={s.retryBtn}>
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <Globe size={15} style={{ ...s.inputIcon, pointerEvents: 'none' }} />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          ...s.input,
          paddingLeft: 36,
          appearance: 'none',
          cursor: 'pointer',
          borderColor: hasFieldError ? 'var(--danger)' : undefined,
        }}
      >
        <option value="">Select a system…</option>
        {systems.map(sys => (
          <option key={sys.id} value={sys.id}>{sys.system_name}</option>
        ))}
      </select>
      <ChevronDown />
    </div>
  );
}

function Field({ label, required, error, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
      {hint  && !error && <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</p>}
      {error && <p role="alert" style={{ fontSize: 11.5, color: 'var(--danger)', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', email: '', source_system_id: '' };

const GLOBAL_STYLES = `@keyframes spin { to { transform: rotate(360deg); } }`;

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  overlay:     { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal:       { background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-xl, 0 20px 60px rgba(0,0,0,0.25))', width: '100%', maxWidth: 480, border: '1px solid var(--border)' },
  header:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' },
  iconBox:     { width: 38, height: 38, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  closeBtn:    { background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' },
  inputWrap:   { position: 'relative' },
  inputIcon:   { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' },
  input:       { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', fontSize: 13.5, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  footer:      { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border)', marginTop: 8 },
  cancelBtn:   { padding: '9px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-secondary)' },
  submitBtn:   { padding: '9px 20px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 },
  errorBanner: { marginBottom: 16, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#DC2626' },
  inlineError: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#DC2626' },
  retryBtn:    { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #FECACA', borderRadius: 6, background: 'white', color: '#DC2626', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  spin:        { animation: 'spin 1s linear infinite' },
};