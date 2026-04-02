import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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
 * EditTicketModal — Complete ticket update flow with error handling
 * 
 * Tasks 1-9 integrated:
 *   1. Constants file ✓ (imported from ticketOptions)
 *   2. Role-based visibility ✓ (using isFieldVisible)
 *   3. Dropdowns only ✓ (select elements)
 *   4. Form initialization ✓ (useEffect on ticket/isOpen)
 *   5. Diff logic ✓ (buildTicketUpdatePayload)
 *   6. Request shape ✓ (payload includes role + changed fields)
 *   7. API call ✓ (ticketService.update)
 *   8. Error handling ✓ (HTTP status → user message)
 *   9. Success flow ✓ (update state + reset form + close modal)
 * 
 * Field visibility rules:
 *   Agent  → status only
 *   Admin  → status, priority, agent_id
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
    status: '',
    priority: '',
    agent_id: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const role = getUserRole();

  // Task 4: Initialize form from ticket
  useEffect(() => {
    if (ticket && isOpen) {
      setFormValues({
        status: ticket.status || '',
        priority: ticket.priority || '',
        agent_id: ticket.agent?.id ?? null,
      });
      setError(null);
    }
  }, [ticket, isOpen]);

  if (!isOpen || !ticket) return null;

  /**
   * Task 5: Build payload with diff logic
   * Only include fields that changed
   */
  const buildPayload = () => {
    return buildTicketUpdatePayload(ticket, formValues, role);
  };

  /**
   * Task 7 & 8 & 9: Handle form submission with API call, error handling, and success flow
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = buildPayload();

    // Task 5: No changes validation
    if (!hasChanges(payload)) {
      alert('No changes to save');
      return;
    }

    setIsLoading(true);

    try {
      // Task 7: Call API with payload using ticketService
      const res = await ticketService.update(ticket.id, payload);
      
      // Extract updated ticket from response (ticketService returns axios response)
      // Backend returns: { success: true, data: { ticket object }, message: "..." }
      const updatedTicket = res.data?.data || res.data;

      // Task 9: Success flow
      // 1. Update parent component state with full ticket response
      if (onUpdate) {
        onUpdate(updatedTicket);
      }

      // 2. Reset form to new saved state
      setFormValues({
        status: updatedTicket.status || '',
        priority: updatedTicket.priority || '',
        agent_id: updatedTicket.agent?.id ?? null,
      });

      // 3. Show success message
      alert('Ticket updated successfully');

      // 4. Close modal
      onClose();

      // 5. Call onSave callback if present (for external state management)
      if (onSave) {
        onSave(updatedTicket);
      }
    } catch (err) {
      // Task 8: Error handling with user-friendly messages
      const userMessage = getErrorMessage(err);
      setError(userMessage);
      alert(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const canEdit = {
    status: isFieldVisible('status', role),
    priority: isFieldVisible('priority', role),
    agent_id: isFieldVisible('agent_id', role),
  };

  return (
    <div
      className="edit-ticket-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
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
          {/* Error message */}
          {error && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FEC2C2',
                color: '#DC2626',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {/* Task 3a: Status dropdown (visible to all roles) */}
          {canEdit.status && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                value={formValues.status}
                onChange={(e) =>
                  setFormValues((v) => ({ ...v, status: e.target.value }))
                }
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

          {/* Task 3b: Priority dropdown (admin only) */}
          {canEdit.priority && (
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                value={formValues.priority}
                onChange={(e) =>
                  setFormValues((v) => ({ ...v, priority: e.target.value }))
                }
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

          {/* Task 3c: Agent dropdown (admin only) */}
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

          {/* Task 2: Info for agents (limited permissions) */}
          {role === 'agent' && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                marginTop: 12,
                padding: '8px 12px',
                background: 'var(--surface-2)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
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
