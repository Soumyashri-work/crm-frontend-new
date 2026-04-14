import { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import {
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from '../constants/ticketOptions';
import { getUserRole, isFieldVisible } from '../utils/rolePermissions';
import { buildTicketUpdatePayload, hasChanges } from '../utils/ticketPayload';
import { ticketService } from '../services/ticketService';
import { getErrorMessage } from '../utils/ticketErrorHandler';
import './EditTicketModal.css';

/**
 * EditTicketModal — Complete ticket update flow with error handling.
 *
 * Pending state contract:
 * When status is set to "pending", a `pending_until` datetime field appears
 * and is required before the form can be submitted. This mirrors the backend
 * validation (TicketUpdateRequest.model_validator) so the user gets a clear
 * inline error rather than a raw API 422.
 *
 * When status changes away from "pending", the pending_until field is hidden
 * and its value is cleared — the backend handles DB cleanup automatically.
 *
 * Field visibility rules:
 * Agent  → status only (+ pending_until when status = "pending")
 * Admin  → status, priority, agent_id (+ pending_until when status = "pending")
 */
export default function EditTicketModal({
  ticket,
  isOpen,
  onClose,
  onSave,
  onUpdate,
  agents = [],
}) {
  const [formValues, setFormValues] = useState({
    status:        '',
    priority:      '',
    agent_id:      null,
    pending_until: '',   // datetime-local string ("YYYY-MM-DDTHH:MM") or ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);

  const role            = getUserRole();
  const isPendingStatus = formValues.status === 'pending' && ticket.crm === 'zammad';

  // Initialize form whenever the modal opens or the ticket changes.
  useEffect(() => {
    if (ticket && isOpen) {
      setFormValues({
        status:        ticket.status  ?? '',
        priority:      ticket.priority ?? '',
        agent_id:      ticket.agent?.id ?? null,
        // Convert stored ISO string back to local datetime format for the input
        pending_until: toDatetimeLocalString(ticket.pending_until),
      });
      setError(null);
    }
  }, [ticket, isOpen]);

  if (!isOpen || !ticket) return null;

  // ----------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setFormValues((prev) => ({
      ...prev,
      status: newStatus,
      // Clear pending_until immediately when leaving pending so the
      // payload builder never picks up a stale value.
      ...(newStatus !== 'pending' ? { pending_until: '' } : {}),
    }));
  };

  const handleFieldChange = (field) => (e) => {
    setFormValues((prev) => ({ ...prev, [field]: e.target.value || null }));
  };

  // ----------------------------------------------------------------
  // Client-side validation
  // ----------------------------------------------------------------

  const validate = () => {
    if (isPendingStatus && !formValues.pending_until) {
      return 'A deadline is required when setting status to Pending.';
    }
    const deadline = formValues.pending_until
      ? new Date(formValues.pending_until)
      : null;
    if (deadline && deadline <= new Date()) {
      return 'The pending deadline must be in the future.';
    }
    return null;
  };

  // ----------------------------------------------------------------
  // Submit
  // ----------------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side validation first — catches the pending_until case
    // before we even build the payload, so the user gets an inline
    // error rather than a round-trip 422.
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = buildTicketUpdatePayload(ticket, formValues, role);

    if (!hasChanges(payload)) {
      setError('No changes to save.');
      return;
    }

    setIsLoading(true);

    try {
      const res           = await ticketService.update(ticket.id, payload);
      const updatedTicket = res.data?.data ?? res.data;

      if (onUpdate) {
        onUpdate(updatedTicket);
      }

      setFormValues({
        status:        updatedTicket.status  ?? '',
        priority:      updatedTicket.priority ?? '',
        agent_id:      updatedTicket.agent?.id ?? null,
        pending_until: toDatetimeLocalString(updatedTicket.pending_until),
      });

      onClose();

      if (onSave) {
        onSave(updatedTicket);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Field visibility
  // ----------------------------------------------------------------

  const canEdit = {
    status:    isFieldVisible('status', role),
    priority:  isFieldVisible('priority', role),
    agent_id:  isFieldVisible('agent_id', role),
  };

  // Minimum datetime string for the pending_until input — prevents
  // the user selecting a time in the past at the browser level.
  // Passing new Date() directly ensures we use local time, not UTC.
  const minDatetime = toDatetimeLocalString(new Date());

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------

  return (
    <div
      className="edit-ticket-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="edit-ticket-modal-content">

        {/* Header */}
        <div className="edit-ticket-modal-header">
          <h2>Edit Ticket</h2>
          <button
            onClick={onClose}
            className="edit-ticket-close-btn"
            aria-label="Close"
            disabled={isLoading}
          >
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="edit-ticket-form">

          {/* Inline error banner */}
          {error && (
            <div className="edit-ticket-error-banner" role="alert">
              {error}
            </div>
          )}

          {/* Status */}
          {canEdit.status && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                value={formValues.status}
                onChange={handleStatusChange}
                className="form-select"
                disabled={isLoading}
              >
                <option value="">— Select status —</option>
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pending deadline — shown only when status is "pending" */}
          {isPendingStatus && (
            <div className="form-group">
              <label className="form-label">
                <Clock size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Pending Until
                <span className="form-label-required" aria-hidden="true"> *</span>
              </label>
              <input
                type="datetime-local"
                name="pending_until"
                value={formValues.pending_until ?? ''}
                min={minDatetime}
                onChange={handleFieldChange('pending_until')}
                className="form-select"
                disabled={isLoading}
                required
              />
              <p className="form-hint">
                The ticket will stay pending until this deadline.
              </p>
            </div>
          )}

          {/* Priority (admin only) */}
          {canEdit.priority && (
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                value={formValues.priority}
                onChange={handleFieldChange('priority')}
                className="form-select"
                disabled={isLoading}
              >
                <option value="">— Select priority —</option>
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Assign to (admin only) */}
          {canEdit.agent_id && (
            <div className="form-group">
              <label className="form-label">Assign To</label>
              <select
                name="agent_id"
                value={formValues.agent_id ?? ''}
                onChange={(e) =>
                  setFormValues((v) => ({
                    ...v,
                    agent_id: e.target.value || null,
                  }))
                }
                className="form-select"
                disabled={isLoading}
              >
                <option value="">— Unassigned —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Agent permission note */}
          {role === 'agent' && (
            <div className="edit-ticket-permission-note">
              💡 You can only update ticket status.
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="edit-ticket-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert an ISO 8601 string (or Date) to the "YYYY-MM-DDTHH:MM" format
 * required by <input type="datetime-local">.
 *
 * Extracts the date and time using local browser timezone methods rather
 * than forcing a UTC conversion.
 *
 * @param {string|Date|null|undefined} dateInput
 * @returns {string}
 */
function toDatetimeLocalString(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const pad = (num) => String(num).padStart(2, '0');

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}