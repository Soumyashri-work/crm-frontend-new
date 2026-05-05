import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Modal } from './Modal';

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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Agent">
      <form onSubmit={handleSubmit} className="modal-body">
        <div className="modal-form-group">
          <label className="modal-form-label">Name</label>
          <input
            type="text"
            className="modal-form-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter agent name"
          />
        </div>

        <div className="modal-form-group">
          <label className="modal-form-label">Email</label>
          <input
            type="email"
            className="modal-form-input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter agent email"
            disabled
          />
          <div className="modal-form-hint">Email cannot be changed</div>
        </div>
      </form>

      <div className="modal-footer">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="modal-btn modal-btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isSaving || !formData.name.trim()}
          className="modal-btn modal-btn-primary"
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}