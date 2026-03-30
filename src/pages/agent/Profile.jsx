import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { agentService } from '../../services/agentService';
import { getInitials, getAvatarColor } from '../../utils/helpers';

export default function AgentProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName:  user?.name?.split(' ')[1] || '',
    email:     user?.email || '',
  });
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await agentService.update(user?.id, {
        name:  `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          Settings › <span style={{ color: 'var(--text-primary)' }}>My Profile</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>My Profile</h2>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {/* Avatar + name header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: user?.picture ? 'transparent' : getAvatarColor(user?.name),
            overflow: 'hidden', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white',
            flexShrink: 0,
          }}>
            {user?.picture
              ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : getInitials(user?.name || 'Agent')
            }
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{user?.name || '—'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.email || '—'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <span className="badge badge-agent">Agent</span>
              {user?.source && (
                <span className="badge badge-inactive" style={{ fontSize: 11 }}>{user.source}</span>
              )}
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              className="form-input"
              value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              placeholder="First name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input
              className="form-input"
              value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com"
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 14, padding: '10px 14px',
            background: '#FEF2F2', border: '1px solid #FCA5A5',
            borderRadius: 'var(--radius-sm)', color: '#DC2626', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Save row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={saving}
            style={{ opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && (
            <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 500 }}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}