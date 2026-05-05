/**
 * AddTenantModal.jsx — Refactored with unified Modal component
 *
 * Features:
 * - Full form validation with field-level error display
 * - Accessible form with proper labeling
 *
 * Props:
 *   isOpen {boolean}    - Controls modal visibility
 *   onClose {function}  - Called when user closes modal
 *   onSubmit {function} - Called after successful creation with tenant object
 */
 
import { useState, useEffect } from 'react';
import { Building2, Mail, Loader2 } from 'lucide-react';
import { Modal } from '../Modal';
import { superAdminService } from '../../services/superAdminService';
 
// ─── Constants ───────────────────────────────────────────────────────────────
 
const EMPTY_FORM = {
  name: '',
  email: '',
};
 
// ─── Component ───────────────────────────────────────────────────────────────
 
export default function AddTenantModal({ isOpen, onClose, onSubmit }) {
  // ─── State ────────────────────────────────────────────────────────────
  const [form, setForm]         = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
 
  // ─── Reset form when modal opens ──────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setApiError('');
    }
  }, [isOpen]);
 
  if (!isOpen) return null;
 
  // ─── Validation ───────────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!form.name.trim())
      e.name = 'Tenant name is required.';
    if (!form.email.trim())
      e.email = 'Contact email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Enter a valid email address.';
    return e;
  }
 
  // ─── Submit handler ───────────────────────────────────────────────────
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
      const tenant = await superAdminService.createTenant({
        name: form.name.trim(),
        email: form.email.trim(),
      });
      onSubmit(tenant);
      onClose();
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }
 
  // ─── Field updater ────────────────────────────────────────────────────
  function field(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  }
 
  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Tenant"
      maxWidth="480px"
      disableBackdropClick={submitting}
      disableEscapeKey={submitting}
    >
      {/* form wraps BOTH body and footer so type="submit" works */}
      <form onSubmit={handleSubmit} noValidate>
 
        <div className="modal-body">
 
          {/* API error banner */}
          {apiError && (
            <div className="modal-error-banner" role="alert">
              {apiError}
            </div>
          )}
 
          {/* Tenant Name */}
          <div className="modal-form-group">
            <label className="modal-form-label">
              Tenant Name <span style={{ color: '#DC2626' }}>*</span>
            </label>
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
              <input
                type="text"
                className={`modal-form-input${errors.name ? ' has-error' : ''}`}
                style={{ paddingLeft: 36 }}
                placeholder="e.g. Global Industries Corp"
                value={form.name}
                onChange={(e) => field('name', e.target.value)}
                autoFocus
                disabled={submitting}
              />
            </div>
            {errors.name && (
              <div className="modal-form-error" role="alert">
                {errors.name}
              </div>
            )}
          </div>
 
          {/* Contact Email */}
          <div className="modal-form-group">
            <label className="modal-form-label">
              Contact Email <span style={{ color: '#DC2626' }}>*</span>
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
                className={`modal-form-input${errors.email ? ' has-error' : ''}`}
                style={{ paddingLeft: 36 }}
                placeholder="admin@company.com"
                value={form.email}
                onChange={(e) => field('email', e.target.value)}
                disabled={submitting}
              />
            </div>
            {errors.email && (
              <div className="modal-form-error" role="alert">
                {errors.email}
              </div>
            )}
          </div>
 
        </div>{/* end modal-body */}
 
        {/* Footer is INSIDE the form so type="submit" triggers onSubmit */}
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
            disabled={submitting}
            className="modal-btn modal-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {submitting ? (
              <>
                <Loader2
                  size={14}
                  style={{ animation: 'spin 1s linear infinite' }}
                />
                Adding…
              </>
            ) : (
              'Add Tenant'
            )}
          </button>
        </div>
 
      </form>
 
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Modal>
  );
}