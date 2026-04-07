import { useState, useEffect } from 'react';
import { X, UserPlus, Mail, User, Loader2, Copy, Check, ExternalLink } from 'lucide-react';
import { agentService } from '../services/agentService';

/**
 * InviteAgentModal
 *
 * Calls POST /invitations/invite-agent (requires admin JWT — sent automatically
 * by the axios instance in api.js via the Authorization header).
 *
 * Props:
 * isOpen   {boolean}
 * onClose  {() => void}
 * onSuccess {(result: object) => void}  – called after a successful invite
 */
export default function InviteAgentModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm]         = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied]             = useState(false);

  // Reset whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setApiError('');
      setInviteResult(null);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Validation ────────────────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!form.email.trim())
      e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Enter a valid email address.';

    if (!form.first_name.trim())
      e.first_name = 'First name is required.';

    return e;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(evt) {
    evt.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError('');

    try {
      const payload = {
        email:      form.email.trim(),
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        name:       `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
        role:       'agent',
      };
      const result = await agentService.inviteAgent(payload);
      
      onSuccess?.(result);
      setInviteResult({ ...payload, ...result }); // Show success screen
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={s.overlay}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={s.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-agent-title"
      >

        {/* ── Header ── */}
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={s.iconBox}>
              <UserPlus size={18} color="white" />
            </div>
            <div>
              <h2
                id="invite-agent-title"
                style={{ fontSize: 17, fontWeight: 700, margin: 0 }}
              >
                {inviteResult ? 'Invite Created' : 'Invite Agent'}
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
                {inviteResult ? `For ${inviteResult.email}` : 'Send an invite link to onboard a new agent'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={s.closeBtn}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        {inviteResult ? (
          <SuccessView result={inviteResult} copied={copied} onCopy={copyLink} onClose={onClose} />
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ padding: '24px 24px 0' }}>

              {/* API-level error banner */}
              {apiError && (
                <div style={s.errorBanner} role="alert">
                  {apiError}
                </div>
              )}

              {/* First Name */}
              <Field label="First Name" required error={errors.first_name}>
                <div style={s.inputWrap}>
                  <User size={15} style={s.inputIcon} />
                  <input
                    style={{
                      ...s.input,
                      paddingLeft: 36,
                      borderColor: errors.first_name ? 'var(--danger)' : undefined,
                    }}
                    placeholder="e.g. John"
                    value={form.first_name}
                    onChange={e => field('first_name', e.target.value)}
                    autoFocus
                  />
                </div>
              </Field>

              {/* Last Name */}
              <Field label="Last Name" error={errors.last_name}>
                <div style={s.inputWrap}>
                  <User size={15} style={s.inputIcon} />
                  <input
                    style={{
                      ...s.input,
                      paddingLeft: 36,
                      borderColor: errors.last_name ? 'var(--danger)' : undefined,
                    }}
                    placeholder="e.g. Doe"
                    value={form.last_name}
                    onChange={e => field('last_name', e.target.value)}
                  />
                </div>
              </Field>

              {/* Email */}
              <Field label="Email Address" required error={errors.email}>
                <div style={s.inputWrap}>
                  <Mail size={15} style={s.inputIcon} />
                  <input
                    type="email"
                    style={{
                      ...s.input,
                      paddingLeft: 36,
                      borderColor: errors.email ? 'var(--danger)' : undefined,
                    }}
                    placeholder="agent@company.com"
                    value={form.email}
                    onChange={e => field('email', e.target.value)}
                  />
                </div>
              </Field>

              {/* Role — fixed to "agent", shown as read-only for transparency */}
              <Field label="Role" hint="Agents can view and manage tickets assigned to them">
                <div style={{ ...s.input, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      padding: '2px 10px',
                      background: 'var(--primary-light, #EFF6FF)',
                      color: 'var(--primary)',
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Agent
                  </span>
                </div>
              </Field>

            </div>

            {/* ── Footer ── */}
            <div style={s.footer}>
              <button
                type="button"
                onClick={onClose}
                style={s.cancelBtn}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={s.submitBtn}
                disabled={submitting}
              >
                {submitting
                  ? <><Loader2 size={14} style={s.spin} /> Sending…</>
                  : <><UserPlus size={14} /> Send Invite</>
                }
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{GLOBAL_STYLES}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SuccessView({ result, copied, onCopy, onClose }) {
  return (
    <div style={{ padding: 24 }}>
      <div style={s.successBadge}>
        <div style={s.successIcon}><Check size={22} color="white" strokeWidth={2.5} /></div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#166534' }}>Invite created successfully</p>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#16a34a' }}>
            Expires in 24 hours · Share this link with <strong>{result.email}</strong>
          </p>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
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
        {result.invite_link && (
          <a href={result.invite_link} target="_blank" rel="noreferrer" style={s.openLink}>
            <ExternalLink size={12} /> Open in new tab
          </a>
        )}
      </div>

      <div style={s.detailsGrid}>
        <DetailRow label="Agent Name"  value={result.name} />
        <DetailRow label="Agent Email" value={result.email} />
        <DetailRow label="Role"        value="Agent" />
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

function Field({ label, required, error, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 6,
          color: 'var(--text-primary)',
        }}
      >
        {label}{' '}
        {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
      {hint && !error && (
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
          {hint}
        </p>
      )}
      {error && (
        <p role="alert" style={{ fontSize: 11.5, color: 'var(--danger)', marginTop: 4 }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = { first_name: '', last_name: '', email: '' };

const GLOBAL_STYLES = `@keyframes spin { to { transform: rotate(360deg); } }`;

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-xl, 0 20px 60px rgba(0,0,0,0.25))',
    width: '100%', maxWidth: 480,
    border: '1px solid var(--border)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid var(--border)',
  },
  iconBox: {
    width: 38, height: 38, borderRadius: 10,
    background: 'var(--primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 6, borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
  },
  inputWrap: { position: 'relative' },
  inputIcon: {
    position: 'absolute', left: 12, top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)', pointerEvents: 'none',
  },
  input: {
    width: '100%', padding: '9px 12px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)',
    fontSize: 13.5, color: 'var(--text-primary)',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    padding: '16px 24px', borderTop: '1px solid var(--border)', marginTop: 8,
  },
  cancelBtn: {
    padding: '9px 18px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)', background: 'var(--surface)',
    fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
    color: 'var(--text-secondary)',
  },
  submitBtn: {
    padding: '9px 20px', borderRadius: 'var(--radius-sm)',
    border: 'none', background: 'var(--primary)',
    fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
    color: 'white', fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 7,
  },
  errorBanner: {
    marginBottom: 16, padding: '10px 14px',
    background: '#FEF2F2', border: '1px solid #FECACA',
    borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#DC2626',
  },
  spin: { animation: 'spin 1s linear infinite' },
  
  // Success View specific styles
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