import { useState, useEffect, useCallback } from 'react';
import { X, Building2, Mail, Globe, Loader2, RefreshCw, Check } from 'lucide-react';
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
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [sourceSystems, setSourceSystems] = useState([]);
  const [loadingSystems, setLoadingSystems] = useState(false);
  const [systemsError, setSystemsError]   = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [errors, setErrors]               = useState({});
  const [apiError, setApiError]           = useState('');

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

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    fetchSourceSystems(controller.signal);
    return () => controller.abort();
  }, [isOpen, fetchSourceSystems]);

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
    if (!form.name.trim())                  e.name              = 'Tenant name is required.';
    if (!form.email.trim())                 e.email             = 'Contact email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email         = 'Enter a valid email.';
    if (form.source_system_ids.length === 0) e.source_system_ids = 'Select at least one source system.';
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
        name:               form.name.trim(),
        email:              form.email.trim(),
        source_system_ids:  form.source_system_ids.map(Number),
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

  // Toggle a single source system id in/out of the selected array
  function toggleSystem(id) {
    const strId = String(id);
    setForm(f => {
      const already = f.source_system_ids.includes(strId);
      return {
        ...f,
        source_system_ids: already
          ? f.source_system_ids.filter(x => x !== strId)
          : [...f.source_system_ids, strId],
      };
    });
    if (errors.source_system_ids) setErrors(e => ({ ...e, source_system_ids: '' }));
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

            {/* Source Systems — multi-select checkbox list */}
            <Field
              label="Source / CRM Systems"
              required
              error={errors.source_system_ids}
              hint={
                !loadingSystems && !systemsError && sourceSystems.length > 0
                  ? `${form.source_system_ids.length} of ${sourceSystems.length} selected`
                  : undefined
              }
            >
              <SourceSystemMultiSelect
                loading={loadingSystems}
                error={systemsError}
                systems={sourceSystems}
                selected={form.source_system_ids}
                onToggle={toggleSystem}
                hasFieldError={!!errors.source_system_ids}
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

function SourceSystemMultiSelect({ loading, error, systems, selected, onToggle, hasFieldError, onRetry }) {
  if (loading) {
    return (
      <div style={{ ...s.checkboxList, justifyContent: 'center', color: 'var(--text-muted)', gap: 8 }}>
        <Loader2 size={14} style={s.spin} />
        <span style={{ fontSize: 13 }}>Loading systems…</span>
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

  if (systems.length === 0) {
    return (
      <div style={{ ...s.checkboxList, color: 'var(--text-muted)', fontSize: 13, justifyContent: 'center' }}>
        No source systems available.
      </div>
    );
  }

  return (
    <div
      style={{
        ...s.checkboxList,
        borderColor: hasFieldError ? 'var(--danger)' : 'var(--border)',
      }}
      role="group"
      aria-label="Source systems"
    >
      {systems.map(sys => {
        const strId   = String(sys.id);
        const checked = selected.includes(strId);
        return (
          <label
            key={sys.id}
            style={{
              ...s.checkboxRow,
              background: checked ? 'var(--primary-subtle, #efe2e2)' : 'transparent',
              borderColor: checked ? 'var(--primary)' : 'transparent',
            }}
          >
            {/* Hidden native checkbox for a11y */}
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(sys.id)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />

{/* Custom checkbox box */}
<span
  style={{
    ...s.checkBox,
    background:   checked ? 'var(--primary)' : 'var(--surface)',
    // Update the unselected border color here (e.g., '#333')
    borderColor:  checked ? 'var(--primary)' : '#333', 
  }}
  aria-hidden="true"
>
  {checked && <Check size={11} color="white" strokeWidth={3} />}
</span>

            <Globe size={14} style={{ color: checked ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: checked ? 600 : 400 }}>
              {sys.system_name}
            </span>
          </label>
        );
      })}
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

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', email: '', source_system_ids: [] }; // ← now an array

const GLOBAL_STYLES = `@keyframes spin { to { transform: rotate(360deg); } }`;

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  overlay:      { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal:        { background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-xl, 0 20px 60px rgba(0,0,0,0.25))', width: '100%', maxWidth: 480, border: '1px solid var(--border)' },
  header:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' },
  iconBox:      { width: 38, height: 38, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  closeBtn:     { background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' },
  inputWrap:    { position: 'relative' },
  inputIcon:    { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' },
  input:        { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', fontSize: 13.5, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  footer:       { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border)', marginTop: 8 },
  cancelBtn:    { padding: '9px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-secondary)' },
  submitBtn:    { padding: '9px 20px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--primary)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 },
  errorBanner:  { marginBottom: 16, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#DC2626' },
  inlineError:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#DC2626' },
  retryBtn:     { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #FECACA', borderRadius: 6, background: 'white', color: '#DC2626', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  spin:         { animation: 'spin 1s linear infinite' },

  // Multi-select checkbox list
  checkboxList: { display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxHeight: 220, overflowY: 'auto' },
  checkboxRow:  { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer', border: '1px solid transparent', borderRadius: 0, transition: 'background 0.15s', userSelect: 'none', position: 'relative' },
  checkBox:     { width: 16, height: 16, borderRadius: 4, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s, border-color 0.15s' },
};