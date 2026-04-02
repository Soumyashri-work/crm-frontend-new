import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

const MOCK_TENANTS = [
  { id: 1, name: 'Global Industries Corp',     domain: 'globalindustries.crm.com' },
  { id: 2, name: 'TechBridge Solutions',       domain: 'techbridge.crm.com' },
  { id: 3, name: 'Innovation Labs Inc',        domain: 'innovationlabs.crm.com' },
  { id: 4, name: 'Digital Dynamics',           domain: 'digitaldynamics.crm.com' },
  { id: 5, name: 'CloudTech Services',         domain: 'cloudtech.crm.com' },
  { id: 6, name: 'Enterprise Solutions Group', domain: 'esg.crm.com' },
  { id: 7, name: 'Acme Corporation',           domain: 'acmecorp.crm.com' },
  { id: 8, name: 'NexusTech Industries',       domain: 'nexustech.crm.com' },
];

export default function AddAdminModal({ isOpen, onClose, onSubmit, tenants }) {
  const tenantList = (tenants && tenants.length > 0) ? tenants : MOCK_TENANTS;

  const [form, setForm]   = useState({ name: '', email: '', tenantId: '' });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const selectedTenant = tenantList.find(t => String(t.id) === String(form.tenantId));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim())  { setError('Admin name is required.'); return; }
    if (!form.email.trim()) { setError('Admin email is required.'); return; }
    if (!form.tenantId)     { setError('Please select a tenant.'); return; }
    onSubmit({
      name:         form.name,
      email:        form.email,
      tenantName:   selectedTenant?.name   || '',
      tenantDomain: selectedTenant?.domain || '',
    });
    setForm({ name: '', email: '', tenantId: '' });
    setError('');
  };

  const handleClose = () => {
    setForm({ name: '', email: '', tenantId: '' });
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
      {/* Modal box */}
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
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Add New Admin</h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
              Assign an admin to an existing tenant
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
            <label className="form-label">Admin Name</label>
            <input
              className="form-input"
              placeholder="e.g. John Anderson"
              value={form.name}
              onChange={e => handle('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="e.g. john@acme.com"
              value={form.email}
              onChange={e => handle('email', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assign Tenant</label>
            <div style={{ position: 'relative' }}>
              <select
                className="form-input"
                value={form.tenantId}
                onChange={e => handle('tenantId', e.target.value)}
                style={{ appearance: 'none', paddingRight: 36, width: '100%', cursor: 'pointer' }}
              >
                <option value="">Select a tenant...</option>
                {tenantList.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{
                position: 'absolute', right: 10, top: '50%',
                transform: 'translateY(-50%)', pointerEvents: 'none',
                color: 'var(--text-muted)',
              }} />
            </div>

            {/* Selected tenant pill */}
            {selectedTenant && (
              <div style={{
                marginTop: 8, display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', background: 'var(--surface-2)',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, background: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>
                    {selectedTenant.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{selectedTenant.name}</span>
              </div>
            )}
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
              Add Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}