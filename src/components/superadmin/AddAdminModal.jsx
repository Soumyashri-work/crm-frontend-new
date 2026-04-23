/**
 * AddAdminModal.jsx — Refactored with unified Modal component
 * 
 * Features:
 * - Multi-step UI: form → success screen
 * - Fetch tenants on modal open
 * - Full form validation with field-level error display
 * - Invite link copy functionality
 * - Accessible form with proper labeling
 * 
 * Props:
 *   isOpen {boolean}   - Controls modal visibility
 *   onClose {function} - Called when user closes modal
 *   onSubmit {function} - Called after successful invite with result object
 */

import { useState, useEffect, useCallback } from 'react';
import { Shield, Mail, User, Building2, Loader2, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';
import { Modal } from '../Modal';
import { superAdminService } from '../../services/superAdminService';

export default function AddAdminModal({ isOpen, onClose, onSubmit }) {
  // ─── State ──────────────────────────────────────────────────────────
  const [form, setForm] = useState(EMPTY_FORM);
  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [tenantsError, setTenantsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [inviteResult, setInviteResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // ─── Fetch tenants callback ──────────────────────────────────────────
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

  // ─── Fetch tenants on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    fetchTenants(controller.signal);
    return () => controller.abort();
  }, [isOpen, fetchTenants]);

  // ─── Reset form state on modal open ──────────────────────────────────
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

  // ─── Validation ─────────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!form.tenant_id) e.tenant_id = 'Please select a tenant.';
    if (!form.first_name.trim()) e.first_name = 'First name is required.';
    if (!form.last_name.trim()) e.last_name = 'Last name is required.';
    if (!form.admin_email.trim()) e.admin_email = 'Admin email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.admin_email))
      e.admin_email = 'Enter a valid email.';
    return e;
  }

  // ─── Submit handler ─────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setApiError('');

    try {
      const result = await superAdminService.inviteAdmin({
        tenant_id: form.tenant_id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        admin_email: form.admin_email.trim(),
      });
      onSubmit(result);
      setInviteResult(result);
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Field update ───────────────────────────────────────────────────
  function field(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  }

  // ─── Copy invite link ───────────────────────────────────────────────
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteResult.invite_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      document.getElementById('admin-invite-link-input')?.select();
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
                <strong>{inviteResult.admin_email}</strong>
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
                <span
                  style={{
                    fontWeight: 400,
                    color: 'var(--text-muted)',
                    fontSize: 11.5,
                    marginLeft: 6,
                  }}
                >
                  (development only)
                </span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="admin-invite-link-input"
                  type="text"
                  readOnly
                  value={inviteResult.invite_link}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    background: '#F8FAFC',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    outline: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                    minWidth: 0,
                  }}
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={copyLink}
                  className="modal-btn modal-btn-secondary"
                  title={copied ? 'Copied!' : 'Copy to clipboard'}
                  style={{
                    background: copied ? '#F0FDF4' : undefined,
                    borderColor: copied ? '#86EFAC' : undefined,
                    color: copied ? '#166534' : undefined,
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={14} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy
                    </>
                  )}
                </button>
              </div>

              {/* Open in new tab link */}
              <a
                href={inviteResult.invite_link}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 8,
                  fontSize: 12,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  opacity: 0.8,
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
            <DetailRow label="Admin Email" value={inviteResult.admin_email} />
            <DetailRow label="Tenant" value={inviteResult.tenant?.name} />
            <DetailRow label="Role" value="Admin" />
            <DetailRow label="Expires" value="24 hours from now" />
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            className="modal-btn modal-btn-primary"
          >
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
      title="Invite Admin"
      maxWidth="480px"
      disableBackdropClick={submitting || loadingTenants}
      disableEscapeKey={submitting || loadingTenants}
    >
      <form onSubmit={handleSubmit} className="modal-body">
        {/* API error banner */}
        {apiError && (
          <div className="modal-error-banner" role="alert">
            {apiError}
          </div>
        )}

        {/* Tenant Selector */}
        <div className="modal-form-group">
          <label className="modal-form-label">
            Tenant (Organization)
            <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <TenantSelect
            loading={loadingTenants}
            error={tenantsError}
            tenants={tenants}
            value={form.tenant_id}
            onChange={(val) => field('tenant_id', val)}
            hasFieldError={!!errors.tenant_id}
            onRetry={() => fetchTenants()}
          />
          {errors.tenant_id && (
            <div className="modal-form-error" role="alert">
              {errors.tenant_id}
            </div>
          )}
          {!errors.tenant_id && !tenantsError && (
            <div className="modal-form-hint">
              Select which organization this admin belongs to
            </div>
          )}
        </div>

        {/* Two-column layout for name fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* First Name */}
          <div className="modal-form-group">
            <label className="modal-form-label">
              First Name
              <span style={{ color: '#DC2626' }}>*</span>
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
                className={`modal-form-input ${
                  errors.first_name ? 'has-error' : ''
                }`}
                style={{ paddingLeft: 36 }}
                placeholder="e.g. John"
                value={form.first_name}
                onChange={(e) => field('first_name', e.target.value)}
                autoFocus
              />
            </div>
            {errors.first_name && (
              <div className="modal-form-error" role="alert">
                {errors.first_name}
              </div>
            )}
          </div>

          {/* Last Name */}
          <div className="modal-form-group">
            <label className="modal-form-label">
              Last Name
              <span style={{ color: '#DC2626' }}>*</span>
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
                className={`modal-form-input ${
                  errors.last_name ? 'has-error' : ''
                }`}
                style={{ paddingLeft: 36 }}
                placeholder="e.g. Anderson"
                value={form.last_name}
                onChange={(e) => field('last_name', e.target.value)}
              />
            </div>
            {errors.last_name && (
              <div className="modal-form-error" role="alert">
                {errors.last_name}
              </div>
            )}
          </div>
        </div>

        {/* Admin Email */}
        <div className="modal-form-group">
          <label className="modal-form-label">
            Admin Email
            <span style={{ color: '#DC2626' }}>*</span>
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
              className={`modal-form-input ${
                errors.admin_email ? 'has-error' : ''
              }`}
              style={{ paddingLeft: 36 }}
              placeholder="admin@company.com"
              value={form.admin_email}
              onChange={(e) => field('admin_email', e.target.value)}
            />
          </div>
          {errors.admin_email && (
            <div className="modal-form-error" role="alert">
              {errors.admin_email}
            </div>
          )}
          {!errors.admin_email && (
            <div className="modal-form-hint">
              An invite link will be sent to this address
            </div>
          )}
        </div>

        {/* Info banner */}
        <div className="modal-info-banner">
          <Shield size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            A single-use invite link will be generated and sent to the admin's
            email. It grants access to their tenant's portal only.
          </span>
        </div>
      </form>

      <div className="modal-footer">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting || loadingTenants}
          className="modal-btn modal-btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={submitting || loadingTenants}
          className="modal-btn modal-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {submitting ? (
            <>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Sending…
            </>
          ) : (
            'Send Invite'
          )}
        </button>
      </div>
    </Modal>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

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

function TenantSelect({
  loading,
  error,
  tenants,
  value,
  onChange,
  hasFieldError,
  onRetry,
}) {
  if (loading) {
    return (
      <div
        style={{
          padding: '9px 12px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        Loading tenants…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 12px',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          color: '#DC2626',
        }}
        role="alert"
      >
        <span>{error}</span>
        <button
          type="button"
          onClick={onRetry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            border: '1px solid #FECACA',
            borderRadius: 6,
            background: 'white',
            color: '#DC2626',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <Building2
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`modal-form-select ${
          hasFieldError ? 'has-error' : ''
        }`}
        style={{
          paddingLeft: 36,
          appearance: 'none',
          cursor: 'pointer',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          backgroundSize: '16px',
          paddingRight: 36,
        }}
      >
        <option value="">Select a tenant…</option>
        {tenants.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Constants ──────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  tenant_id: '',
  first_name: '',
  last_name: '',
  admin_email: '',
};