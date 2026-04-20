import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDeleteModal({ agent, isOpen, onClose, onConfirm, isDeleting }) {
  if (!isOpen || !agent) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" style={{ maxWidth: 420 }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Delete Agent</h2>
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-label="Close"
          >
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Warning Alert - NOW USING .alert-error CLASS */}
          <div className="alert-error" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 4 }}>
                  Warning
                </div>
                <div style={{ fontSize: 'var(--font-sm)', color: '#7F1D1D', lineHeight: 1.5 }}>
                  This action cannot be undone. All data associated with{' '}
                  <strong>{agent.name}</strong> will be permanently deleted.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Are you sure you want to delete <strong>{agent.name}</strong>?
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                fontFamily: 'inherit',
                opacity: isDeleting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm()}
              disabled={isDeleting}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: '#DC2626',
                color: 'white',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                opacity: isDeleting ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {isDeleting && (
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
              )}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}