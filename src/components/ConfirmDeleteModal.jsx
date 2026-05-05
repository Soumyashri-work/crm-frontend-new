import { AlertTriangle, X } from 'lucide-react';
import { Modal } from './Modal';

export default function ConfirmDeleteModal({ agent, isOpen, onClose, onConfirm, isDeleting }) {
  if (!isOpen || !agent) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Agent" maxWidth="420px">
      <div className="modal-body">
        {/* Warning Alert */}
        <div className="modal-error-banner">
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Warning</div>
            <div>
              This action cannot be undone. All data associated with <strong>{agent.name}</strong> will be permanently deleted.
            </div>
          </div>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>{agent.name}</strong>?
        </div>
      </div>

      <div className="modal-footer">
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="modal-btn modal-btn-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm()}
          disabled={isDeleting}
          className="modal-btn modal-btn-danger"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {isDeleting && (
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
          )}
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
}