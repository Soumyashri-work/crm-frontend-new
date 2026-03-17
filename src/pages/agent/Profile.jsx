import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { getInitials } from '../../utils/helpers';

export default function AgentProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
  });
  const [saved, setSaved] = useState(false);

  const save = async () => {
    try {
      await userService.updateProfile({ name: `${form.firstName} ${form.lastName}`, email: form.email });
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>My Profile</h2>

      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: user?.picture ? 'transparent' : 'var(--primary)',
            overflow: 'hidden', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white',
          }}>
            {user?.picture
              ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : getInitials(user?.name || 'User')
            }
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user?.email}</div>
            <span className="badge badge-agent" style={{ marginTop: 4 }}>Agent</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-primary" onClick={save}>Save Changes</button>
          {saved && <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 500 }}>✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}
