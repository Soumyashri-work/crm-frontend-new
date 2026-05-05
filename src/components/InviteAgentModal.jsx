/**
 * InviteAgentModal.jsx — Fixed: existing agents now use /invitations/invite-agent endpoint
 *
 * Fix applied:
 * - Existing agents (pre-filled mode) now call agentService.inviteAgent(payload)
 *   instead of agentService.invite(agentId) which was returning 404.
 * - Both new and existing agent flows use the same working backend endpoint.
 *
 * Props:
 *   isOpen {boolean}         - Controls modal visibility
 *   onClose {function}       - Called when user closes modal
 *   onSuccess {function}     - Called after successful invite (does NOT close modal)
 *   agentId {string|number}  - For existing agent mode (optional)
 *   initialData {object}     - Pre-filled data for existing agent mode { first_name, last_name, email }
 */

import { useState, useEffect } from 'react';
import { UserPlus, Mail, User, Loader2, Copy, Check, ExternalLink } from 'lucide-react';
import { Modal } from './Modal';
import { agentService } from '../services/agentService';

export default function InviteAgentModal({
  isOpen,
  onClose,
  onSuccess,
  agentId = null,
  initialData = null,
}) {
  // ─── State ──────────────────────────────────────────────────────────
  const isExistingAgent = !!agentId;
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // ─── Reset state on modal open ───────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              first_name: initialData.first_name ?? '',
              last_name: initialData.last_name ?? '',
              email: initialData.email ?? '',
            }
          : EMPTY_FORM
      );
      setErrors({});
      setApiError('');
      setInviteResult(null);
      setCopied(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // ─── Validation ─────────────────────────────────────────────────────
  function validate() {
    // For existing agents, fields are read-only but still validate before sending
    const e = {};

    if (!form.email.trim()) {
      e.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      e.email = 'Enter a valid email address.';
    }

    if (!form.first_name.trim()) {
      e.first_name = 'First name is required.';
    }

    return e;
  }

  // ─── Submit handler ─────────────────────────────────────────────────
  async function handleSubmit(evt) {
    evt.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setApiError('');

    try {
      // ✅ Both new and existing agents use the same working endpoint.
      // The backend route POST /agents/:id/invite does not exist,
      // so we always use POST /invitations/invite-agent with the form data.
      const payload = {
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
        role: 'agent',
      };

      const result = await agentService.inviteAgent(payload);

      // Merge form data into result so success view has name/email
      const merged = {
        email: form.email,
        name: `${form.first_name} ${form.last_name}`.trim(),
        ...result,
      };

      setInviteResult(merged);  // ✅ Show success screen first
      onSuccess?.(merged);      // ✅ Notify parent (parent should NOT close modal here)
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Field update ───────────────────────────────────────────────────
  function handleFieldChange(key, value) {
    if (isExistingAgent) return; // Locked in existing-agent mode
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((e) => ({ ...e, [key]: '' }));
    }
  }

  // ─── Copy invite link ───────────────────────────────────────────────
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteResult.invite_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.getElementById('invite-link-input');
      if (input) input.select();
    }
  }

  // ─── Render: Success screen ─────────────────────────────────────────
  if (inviteResult) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Invite Created"
        maxWidth="480px"
      >
        <div className="modal-body">
          {/* Success banner */}
          <div className="modal-success-banner">
            <Check size={18} />
            <div>
              <div style={{ fontWeight: 600 }}>Invite created successfully</div>
              <div style={{ fontSize: 12, marginTop: 2 }}>
                Expires in 24 hours · Share this link with{' '}
                <strong>{inviteResult.email}</strong>
              </div>
            </div>
          </div>

          {/* Invite link section */}
          {inviteResult.invite_link && (
            <div style={{ marginTop: 20, marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: 'var(--text-primary)',
                }}
              >
                🔗 Invite Link
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="invite-link-input"
                  type="text"
                  readOnly
                  value={inviteResult.invite_link}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={copyLink}
                  className="modal-btn modal-btn-secondary"
                  title={copied ? 'Copied!' : 'Copy to clipboard'}
                >
                  {copied ? (
                    <><Check size={14} /> Copied</>
                  ) : (
                    <><Copy size={14} /> Copy</>
                  )}
                </button>
              </div>

              <a
                href={inviteResult.invite_link}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 8,
                  fontSize: 12,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                <ExternalLink size={12} /> Open in new tab
              </a>
            </div>
          )}

          {/* Details grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              fontSize: 13,
              padding: '16px 0',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              marginBottom: 20,
            }}
          >
            <DetailRow label="Agent Name" value={inviteResult.name} />
            <DetailRow label="Agent Email" value={inviteResult.email} />
            <DetailRow label="Role" value="Agent" />
            <DetailRow label="Expires" value="24 hours from now" />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="modal-btn modal-btn-primary">
            Done
          </button>
        </div>
      </Modal>
    );
  }

  // ─── Render: Form screen ────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isExistingAgent ? 'Send Invite' : 'Invite Agent'}
      maxWidth="480px"
      disableBackdropClick={submitting}
      disableEscapeKey={submitting}
    >
      <form onSubmit={handleSubmit} className="modal-body">
        {/* API error banner */}
        {apiError && (
          <div className="modal-error-banner" role="alert">
            {apiError}
          </div>
        )}

        {/* Info banner for existing agents */}
        {isExistingAgent && (
          <div className="modal-info-banner">
            Agent details are pre-filled from their profile and cannot be changed here.
          </div>
        )}

        {/* First Name Field */}
        <div className="modal-form-group">
          <label className="modal-form-label">
            First Name
            {!isExistingAgent && <span style={{ color: '#DC2626' }}>*</span>}
          </label>
          <div style={{ position: 'relative' }}>
            <User
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              className={`modal-form-input ${errors.first_name ? 'has-error' : ''}`}
              style={{
                paddingLeft: 36,
                background: isExistingAgent ? 'var(--surface-2)' : 'var(--surface)',
                color: isExistingAgent ? 'var(--text-muted)' : 'var(--text-primary)',
              }}
              placeholder="e.g. John"
              value={form.first_name}
              onChange={(e) => handleFieldChange('first_name', e.target.value)}
              readOnly={isExistingAgent}
              autoFocus={!isExistingAgent}
            />
          </div>
          {errors.first_name && (
            <div className="modal-form-error" role="alert">
              {errors.first_name}
            </div>
          )}
        </div>

        {/* Last Name Field */}
        <div className="modal-form-group">
          <label className="modal-form-label">Last Name</label>
          <div style={{ position: 'relative' }}>
            <User
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              className={`modal-form-input ${errors.last_name ? 'has-error' : ''}`}
              style={{
                paddingLeft: 36,
                background: isExistingAgent ? 'var(--surface-2)' : 'var(--surface)',
                color: isExistingAgent ? 'var(--text-muted)' : 'var(--text-primary)',
              }}
              placeholder="e.g. Doe"
              value={form.last_name}
              onChange={(e) => handleFieldChange('last_name', e.target.value)}
              readOnly={isExistingAgent}
            />
          </div>
          {errors.last_name && (
            <div className="modal-form-error" role="alert">
              {errors.last_name}
            </div>
          )}
        </div>

        {/* Email Field */}
        <div className="modal-form-group">
          <label className="modal-form-label">
            Email Address
            {!isExistingAgent && <span style={{ color: '#DC2626' }}>*</span>}
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="email"
              className={`modal-form-input ${errors.email ? 'has-error' : ''}`}
              style={{
                paddingLeft: 36,
                background: isExistingAgent ? 'var(--surface-2)' : 'var(--surface)',
                color: isExistingAgent ? 'var(--text-muted)' : 'var(--text-primary)',
              }}
              placeholder="agent@company.com"
              value={form.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              readOnly={isExistingAgent}
              autoFocus={isExistingAgent}
            />
          </div>
          {errors.email && (
            <div className="modal-form-error" role="alert">
              {errors.email}
            </div>
          )}
        </div>

        {/* Role Field (Read-only) */}
        <div className="modal-form-group">
          <label className="modal-form-label">Role</label>
          <div
            style={{
              padding: '9px 12px',
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                background: 'var(--primary-light)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--primary)',
              }}
            >
              Agent
            </span>
          </div>
        </div>
      </form>

      <div className="modal-footer">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="modal-btn modal-btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={submitting}
          className="modal-btn modal-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {submitting ? (
            <>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Sending…
            </>
          ) : (
            <>
              <UserPlus size={14} />
              Send Invite
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          fontWeight: 600,
          color: 'var(--text-muted)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
        {value || '—'}
      </div>
    </div>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_FORM = { first_name: '', last_name: '', email: '' };