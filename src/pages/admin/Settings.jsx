import { useState } from 'react';
import { Settings as SettingsIcon, Shield, User } from 'lucide-react';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';

const tabs = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'roles',   label: 'Roles & Permissions', icon: Shield },
  { id: 'profile', label: 'Profile', icon: User },
];

const ADMIN_PERMS = ['View all tickets', 'Manage users', 'Manage accounts', 'System settings', 'Delete data'];
const AGENT_PERMS = ['View assigned tickets', 'Update ticket status', 'Add comments', 'View customer details', 'Delete tickets'];

function GeneralTab() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: 'Unified CRM Ticket System', timezone: 'UTC', dateFormat: 'MM/DD/YYYY' });
  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="card" style={{ padding: 28, maxWidth: 640 }}>
      <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 24 }}>System Settings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="form-group">
          <label className="form-label">System Name</label>
          <input className="form-input" value={form.name} onChange={e => handle('name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Default Timezone</label>
          <select className="form-input" value={form.timezone} onChange={e => handle('timezone', e.target.value)}>
            {['UTC','America/New_York','America/Los_Angeles','Europe/London','Asia/Tokyo','Asia/Kolkata'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date Format</label>
          <select className="form-input" value={form.dateFormat} onChange={e => handle('dateFormat', e.target.value)}>
            {['MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD'].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-primary" onClick={save}>Save Changes</button>
        {saved && <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 500 }}>✓ Saved successfully</span>}
      </div>
    </div>
  );
}

function RolesTab() {
  const RoleCard = ({ title, subtitle, badge, perms, defaultChecked }) => (
    <div className="card" style={{ padding: 22, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</div>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>{badge}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {perms.map((p, idx) => (
          <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" defaultChecked={defaultChecked[idx] !== false} style={{ accentColor: 'var(--primary)', width: 15, height: 15 }} />
            {p}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 600 }}>
      <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 18 }}>Role Management</h3>
      <RoleCard title="Admin" subtitle="Full system access" badge="System Role" perms={ADMIN_PERMS} defaultChecked={[true,true,true,true,true]} />
      <RoleCard title="Agent" subtitle="Support team member" badge="Default Role" perms={AGENT_PERMS} defaultChecked={[true,true,true,true,false]} />
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
  });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saved, setSaved] = useState(false);

  const saveProfile = async () => {
    try {
      await userService.updateProfile({ name: `${form.firstName} ${form.lastName}`, email: form.email });
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Profile card */}
      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 22 }}>Profile Information</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: user?.picture ? 'transparent' : 'var(--primary)',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: 'white',
          }}>
            {user?.picture ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.name?.[0] || 'U')}
          </div>
          <button className="btn btn-outline" style={{ fontSize: 13 }}>Change Avatar</button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>JPG, GIF or PNG. Max size of 2MB.</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
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
          <button className="btn btn-primary" onClick={saveProfile}>Update Profile</button>
          {saved && <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 500 }}>✓ Updated</span>}
        </div>
      </div>
      {/* Password card */}
      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 22 }}>Change Password</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 360 }}>
          {[['current','Current Password'],['newPw','New Password'],['confirm','Confirm New Password']].map(([key, label]) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <input className="form-input" type="password" value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 4 }}>Update Password</button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          <a href="/admin/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</a> › <span style={{ color: 'var(--text-primary)' }}>Settings</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Settings</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>Manage your system configuration and preferences</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 16px', border: 'none', background: 'none',
              cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
              color: activeTab === id ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: `2px solid ${activeTab === id ? 'var(--primary)' : 'transparent'}`,
              marginBottom: -1, transition: 'all var(--transition)',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div style={{ paddingTop: 4 }}>
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'roles'   && <RolesTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </div>
    </div>
  );
}
