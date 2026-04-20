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
        <div className="modal-header">
          <h2>Edit Agent</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close"
          >
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group-item">
            <label className="form-label-uppercase">
              Name
            </label>
            <input
              type="text"
              className="form-input w-full"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter agent name"
            />
          </div>

          <div className="form-group-item">
            <label className="form-label-uppercase">
              Email
            </label>
            <input
              type="email"
              className="form-input w-full"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter agent email"
              disabled
            />
            <div className="form-helper-text">
              Email cannot be changed
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.name.trim()}
              className="btn btn-primary"
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}