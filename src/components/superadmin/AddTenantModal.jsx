import { useState } from 'react';
import { X } from 'lucide-react';

export default function AddTenantModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm]   = useState({ name: '', contactEmail: '' });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim())         { setError('Tenant name is required.'); return; }
    if (!form.contactEmail.trim()) { setError('Contact email is required.'); return; }
    onSubmit(form);
    setForm({ name: '', contactEmail: '' });
    setError('');
  };

  const handleClose = () => {
    setForm({ name: '', contactEmail: '' });
    setError('');
    onClose();
  };

  return (
    // Overlay — fixed, full screen, flex centered
    <div
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      {/* Modal box — no animation to avoid left-corner flash */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        width: '90%',
        maxWidth: 420,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Add New Tenant</h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
              Register a new tenant organization
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              padding: '9px 13px', background: '#FEF2F2',
              border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)',
              color: '#DC2626', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Tenant Name</label>
            <input
              className="form-input"
              placeholder="e.g. Acme Corporation"
              value={form.name}
              onChange={e => handle('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="e.g. admin@acme.com"
              value={form.contactEmail}
              onChange={e => handle('contactEmail', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: '9px 18px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', background: 'transparent',
                cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
                color: 'var(--text-secondary)', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 18px', border: 'none',
                borderRadius: 'var(--radius-sm)', background: 'var(--primary)',
                color: 'white', cursor: 'pointer', fontSize: 13.5,
                fontWeight: 600, fontFamily: 'inherit',
              }}
            >
              Register Tenant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}