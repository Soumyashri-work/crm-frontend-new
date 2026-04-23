import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock } from 'lucide-react';
import { Modal } from './Modal';
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

export default function EditTicketModal({
  ticket,
  isOpen,
  onClose,
  onSave,
  onUpdate,
  agents = [],
}) {
  const [formValues, setFormValues] = useState({
    status: '',
    priority: '',
    agent_id: null,
    pending_until: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const role = getUserRole();
  const isPendingStatus = formValues.status === 'pending' && ticket?.crm === 'zammad';

  useEffect(() => {
    if (ticket && isOpen) {
      setFormValues({
        status: ticket.status ?? '',
        priority: ticket.priority ?? '',
        agent_id: ticket.agent?.id ?? null,
        pending_until: toDatetimeLocalString(ticket.pending_until),
      });
      setError(null);
    }
  }, [ticket, isOpen]);

  if (!isOpen || !ticket) return null;

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setFormValues((prev) => ({
      ...prev,
      status: newStatus,
      ...(newStatus !== 'pending' ? { pending_until: '' } : {}),
    }));
  };

  const handleFieldChange = (field) => (e) => {
    setFormValues((prev) => ({ ...prev, [field]: e.target.value || null }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

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
      const res = await ticketService.update(ticket.id, payload);
      const updatedTicket = res.data?.data ?? res.data;

      setFormValues({
        status: updatedTicket.status ?? '',
        priority: updatedTicket.priority ?? '',
        agent_id: updatedTicket.agent?.id ?? null,
        pending_until: toDatetimeLocalString(updatedTicket.pending_until),
      });

      onClose();

      if (onSave) onSave(updatedTicket);
      if (onUpdate) onUpdate(updatedTicket);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const canEdit = {
    status: isFieldVisible('status', role),
    priority: isFieldVisible('priority', role),
    agent_id: isFieldVisible('agent_id', role),
  };

  const minDatetime = toDatetimeLocalString(new Date());

  const modalContent = (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Ticket"
      maxWidth="500px"
      disableBackdropClick={isLoading}
      disableEscapeKey={isLoading}
      zIndex={1300}
    >
      <form onSubmit={handleSubmit} className="modal-body">
        {/* Error Banner */}
        {error && (
          <div className="modal-error-banner" role="alert">
            {error}
          </div>
        )}

        {/* Status */}
        {canEdit.status && (
          <div className="modal-form-group">
            <label className="modal-form-label">Status</label>
            <select
              name="status"
              value={formValues.status}
              onChange={handleStatusChange}
              className="modal-form-select"
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

        {/* Pending deadline */}
        {isPendingStatus && (
          <div className="modal-form-group">
            <label className="modal-form-label">
              <Clock size={12} style={{ display: 'inline', marginRight: 6 }} />
              Pending Until <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="datetime-local"
              name="pending_until"
              value={formValues.pending_until ?? ''}
              min={minDatetime}
              onChange={handleFieldChange('pending_until')}
              className="modal-form-input"
              disabled={isLoading}
              required
            />
            <div className="modal-form-hint">
              The ticket will stay pending until this deadline.
            </div>
          </div>
        )}

        {/* Priority (admin only) */}
        {canEdit.priority && (
          <div className="modal-form-group">
            <label className="modal-form-label">Priority</label>
            <select
              name="priority"
              value={formValues.priority}
              onChange={handleFieldChange('priority')}
              className="modal-form-select"
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
          <div className="modal-form-group">
            <label className="modal-form-label">Assign To</label>
            <select
              name="agent_id"
              value={formValues.agent_id ?? ''}
              onChange={(e) =>
                setFormValues((v) => ({
                  ...v,
                  agent_id: e.target.value || null,
                }))
              }
              className="modal-form-select"
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
          <div className="modal-info-banner">
            💡 You can only update ticket status.
          </div>
        )}
      </form>

      <div className="modal-footer">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="modal-btn modal-btn-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="modal-btn modal-btn-primary"
        >
          {isLoading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );

  // Use createPortal to ensure this modal stays above other modals (z-index: 1300)
  return createPortal(modalContent, document.body);
}

// Helper function (keep from original)
function toDatetimeLocalString(value) {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}