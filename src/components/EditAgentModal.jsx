import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function EditAgentModal({ agent, isOpen, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({ name: '', email: '' });

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        email: agent.email || '',
      });
    }
  }, [agent, isOpen]);

  if (!isOpen || !agent) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
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
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Edit Agent</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-label="Close"
          >
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Name
            </label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%' }}
              placeholder="Enter agent name"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Email
            </label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%' }}
              placeholder="Enter agent email"
              disabled
            />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Email cannot be changed
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                fontFamily: 'inherit',
                opacity: isSaving ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.name.trim()}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary)',
                color: 'white',
                cursor: isSaving || !formData.name.trim() ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                opacity: isSaving || !formData.name.trim() ? 0.6 : 1,
              }}
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
