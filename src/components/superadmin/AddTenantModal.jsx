/**
 * AddTenantModal.jsx — Refactored with unified Modal component
 * 
 * Features:
 * - Fetch source systems on modal open
 * - Multi-select checkboxes for CRM systems
 * - Full form validation with field-level error display
 * - Accessible form with proper labeling
 * 
 * Props:
 *   isOpen {boolean}   - Controls modal visibility
 *   onClose {function} - Called when user closes modal
 *   onSubmit {function} - Called after successful creation with tenant object
 */

import { useState, useEffect, useCallback } from 'react';
import { Building2, Mail, Globe, Loader2, RefreshCw, Check } from 'lucide-react';
import { Modal } from '../Modal';
import { superAdminService } from '../../services/superAdminService';

export default function AddTenantModal({ isOpen, onClose, onSubmit }) {
  // ─── State ──────────────────────────────────────────────────────────
  const [form, setForm] = useState(EMPTY_FORM);
  const [sourceSystems, setSourceSystems] = useState([]);
  const [loadingSystems, setLoadingSystems] = useState(false);
  const [systemsError, setSystemsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // ─── Fetch source systems callback ───────────────────────────────────
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

  // ─── Fetch systems on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    fetchSourceSystems(controller.signal);
    return () => controller.abort();
  }, [isOpen, fetchSourceSystems]);

  // ─── Reset form state on modal open ──────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setApiError('');
      setSystemsError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ─── Validation ─────────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Tenant name is required.';
    if (!form.email.trim()) e.email = 'Contact email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Enter a valid email.';
    if (form.source_system_ids.length === 0)
      e.source_system_ids = 'Select at least one source system.';
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
      const tenant = await superAdminService.createTenant({
        name: form.name.trim(),
        email: form.email.trim(),
        source_system_ids: form.source_system_ids.map(Number),
      });
      onSubmit(tenant);
      onClose();
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

  // ─── Toggle source system selection ──────────────────────────────────
  function toggleSystem(id) {
    const strId = String(id);
    setForm((f) => {
      const already = f.source_system_ids.includes(strId);
      return {
        ...f,
        source_system_ids: already
          ? f.source_system_ids.filter((x) => x !== strId)
          : [...f.source_system_ids, strId],
      };
    });
    if (errors.source_system_ids)
      setErrors((e) => ({ ...e, source_system_ids: '' }));
  }

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Tenant"
      maxWidth="480px"
      disableBackdropClick={submitting || loadingSystems}
      disableEscapeKey={submitting || loadingSystems}
    >
      <form onSubmit={handleSubmit} className="modal-body">
        {/* API error banner */}
        {apiError && (
          <div className="modal-error-banner" role="alert">
            {apiError}
          </div>
        )}

        {/* Tenant Name */}
        <div className="modal-form-group">
          <label className="modal-form-label">
            Tenant Name
            <span style={{ color: '#DC2626' }}>*</span>
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
              className={`modal-form-input ${
                errors.name ? 'has-error' : ''
              }`}
              style={{ paddingLeft: 36 }}
              placeholder="e.g. Global Industries Corp"
              value={form.name}
              onChange={(e) => field('name', e.target.value)}
              autoFocus
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
            Contact Email
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
                errors.email ? 'has-error' : ''
              }`}
              style={{ paddingLeft: 36 }}
              placeholder="admin@company.com"
              value={form.email}
              onChange={(e) => field('email', e.target.value)}
            />
          </div>
          {errors.email && (
            <div className="modal-form-error" role="alert">
              {errors.email}
            </div>
          )}
        </div>

        {/* Source / CRM Systems */}
        <div className="modal-form-group">
          <label className="modal-form-label">
            Source / CRM Systems
            <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <SourceSystemMultiSelect
            loading={loadingSystems}
            error={systemsError}
            systems={sourceSystems}
            selected={form.source_system_ids}
            onToggle={toggleSystem}
            hasFieldError={!!errors.source_system_ids}
            onRetry={() => fetchSourceSystems()}
          />
          {errors.source_system_ids && (
            <div className="modal-form-error" role="alert">
              {errors.source_system_ids}
            </div>
          )}
          {!errors.source_system_ids &&
            !loadingSystems &&
            !systemsError &&
            sourceSystems.length > 0 && (
              <div className="modal-form-hint">
                {form.source_system_ids.length} of {sourceSystems.length}{' '}
                selected
              </div>
            )}
        </div>
      </form>

      <div className="modal-footer">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting || loadingSystems}
          className="modal-btn modal-btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={submitting || loadingSystems}
          className="modal-btn modal-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {submitting ? (
            <>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Adding…
            </>
          ) : (
            'Add Tenant'
          )}
        </button>
      </div>
    </Modal>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SourceSystemMultiSelect({
  loading,
  error,
  systems,
  selected,
  onToggle,
  hasFieldError,
  onRetry,
}) {
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
          color: 'var(--text-muted)',
          gap: 8,
        }}
      >
        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 13 }}>Loading systems…</span>
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

  if (systems.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        No source systems available.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${
          hasFieldError ? 'var(--danger)' : 'var(--border)'
        }`,
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        maxHeight: 220,
        overflowY: 'auto',
      }}
      role="group"
      aria-label="Source systems"
    >
      {systems.map((sys) => {
        const strId = String(sys.id);
        const checked = selected.includes(strId);
        return (
          <label
            key={sys.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 12px',
              cursor: 'pointer',
              background: checked ? 'var(--primary-light)' : 'transparent',
              transition: 'background 0.15s',
              userSelect: 'none',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {/* Hidden native checkbox for a11y */}
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(sys.id)}
              style={{
                position: 'absolute',
                opacity: 0,
                width: 0,
                height: 0,
              }}
            />

            {/* Custom checkbox box */}
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: `1.5px solid ${
                  checked ? 'var(--primary)' : 'var(--border)'
                }`,
                background: checked ? 'var(--primary)' : 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s, border-color 0.15s',
              }}
              aria-hidden="true"
            >
              {checked && <Check size={11} color="white" strokeWidth={3} />}
            </span>

            <Globe
              size={14}
              style={{
                color: checked ? 'var(--primary)' : 'var(--text-muted)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 13.5,
                color: 'var(--text-primary)',
                fontWeight: checked ? 600 : 400,
              }}
            >
              {sys.system_name}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Constants ──────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  email: '',
  source_system_ids: [],
};