import { useState } from 'react';
import { Settings as SettingsIcon, Shield, User, Plug } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import ProvisionCredentialsForm from '../../components/ProvisionCredentialsForm';

const tabs = [
  { id: 'general',      label: 'General',            icon: SettingsIcon },
  { id: 'roles',        label: 'Roles & Permissions', icon: Shield },
  { id: 'profile',      label: 'Profile',             icon: User },
  { id: 'integrations', label: 'Integrations',        icon: Plug },
];

const ADMIN_PERMS = ['View all tickets', 'Manage agents', 'Manage accounts', 'System settings', 'Delete data'];
const AGENT_PERMS = ['View assigned tickets', 'Update ticket status', 'Add comments', 'View customer details', 'Delete tickets'];

// ---------------------------------------------------------------------------
// General Tab
// ---------------------------------------------------------------------------
function GeneralTab() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name:       'Unified CRM Ticket System',
    timezone:   'UTC',
    dateFormat: 'MM/DD/YYYY',
  });

  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    // TODO: wire to a system-settings API endpoint when available
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
            {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo', 'Asia/Kolkata'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date Format</label>
          <select className="form-input" value={form.dateFormat} onChange={e => handle('dateFormat', e.target.value)}>
            {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
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

// ---------------------------------------------------------------------------
// Roles Tab
// ---------------------------------------------------------------------------
function RolesTab() {
  const RoleCard = ({ title, subtitle, badge, perms, defaultChecked }) => (
    <div className="card" style={{ padding: 22, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</div>
        </div>
        <span style={{
          fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          {badge}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {perms.map((p, idx) => (
          <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
            <input
              type="checkbox"
              defaultChecked={defaultChecked[idx] !== false}
              style={{ accentColor: 'var(--primary)', width: 15, height: 15 }}
            />
            {p}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 600 }}>
      <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 18 }}>Role Management</h3>
      <RoleCard
        title="Admin" subtitle="Full system access" badge="System Role"
        perms={ADMIN_PERMS} defaultChecked={[true, true, true, true, true]}
      />
      <RoleCard
        title="Agent" subtitle="Support team member" badge="Default Role"
        perms={AGENT_PERMS} defaultChecked={[true, true, true, true, false]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile Tab  (admin editing their own info — no backend endpoint yet)
// ---------------------------------------------------------------------------
function ProfileTab() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName:  user?.name?.split(' ')[1] || '',
    email:     user?.email || '',
  });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saved,  setSaved]  = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  // TODO: replace with real API call (e.g. PUT /auth/me or PUT /admins/me)
  const saveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // TODO: wire to a change-password endpoint when available
  const savePassword = () => {
    if (!pwForm.current || !pwForm.newPw || pwForm.newPw !== pwForm.confirm) return;
    setPwSaved(true);
    setPwForm({ current: '', newPw: '', confirm: '' });
    setTimeout(() => setPwSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Profile card */}
      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 22 }}>Profile Information</h3>

        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: user?.picture ? 'transparent' : getAvatarColor(user?.name),
            overflow: 'hidden', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white',
          }}>
            {user?.picture
              ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : getInitials(user?.name || 'Admin')
            }
          </div>
          <button className="btn btn-outline" style={{ fontSize: 13 }}>Change Avatar</button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>JPG, GIF or PNG. Max size of 2 MB.</span>
        </div>

        {/* Name + email fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              className="form-input"
              value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input
              className="form-input"
              value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
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
          />
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
          {[
            ['current', 'Current Password'],
            ['newPw',   'New Password'],
            ['confirm', 'Confirm New Password'],
          ].map(([key, label]) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <input
                className="form-input"
                type="password"
                value={pwForm[key]}
                onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}

          {/* Mismatch hint */}
          {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
            <span style={{ fontSize: 12, color: 'var(--danger)', marginTop: -6 }}>
              Passwords do not match.
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <button
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start' }}
              onClick={savePassword}
              disabled={!pwForm.current || !pwForm.newPw || pwForm.newPw !== pwForm.confirm}
            >
              Update Password
            </button>
            {pwSaved && <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 500 }}>✓ Password updated</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Integrations Tab — embeds ProvisionCredentialsForm as an inline card (non-modal)
// ---------------------------------------------------------------------------
function IntegrationsTab() {
  const [provisionedCount, setProvisionedCount] = useState(0);

  const handleProvisionSuccess = (data) => {
    console.log('Integration provisioned:', data.integration_id);
    setProvisionedCount((c) => c + 1);
  };

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 6px' }}></h3>
 
        {provisionedCount > 0 && (
          <div style={{
            marginTop: 12,
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 8, padding: '6px 12px',
            fontSize: 13, color: '#15803d', fontWeight: 500,
          }}>
            <span>✓</span>
            {provisionedCount} integration{provisionedCount > 1 ? 's' : ''} provisioned this session
          </div>
        )}
      </div>

      {/*
        ProvisionCredentialsForm rendered as an inline card (modal=false).
        onClose is a no-op here since there's nothing to close in an inline context.
        onSuccess updates the session counter above.
      */}
      <ProvisionCredentialsForm
        modal={false}
        onClose={() => {}}
        onSuccess={handleProvisionSuccess}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings (shell)
// ---------------------------------------------------------------------------
export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          <a href="/admin/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</a>
          {' › '}
          <span style={{ color: 'var(--text-primary)' }}>Settings</span>
        </div>
        <h2 style={{ fontSize: 25, fontWeight: 800 }}>Settings</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)' }}>
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
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div style={{ paddingTop: 4 }}>
        {activeTab === 'general'      && <GeneralTab />}
        {activeTab === 'roles'        && <RolesTab />}
        {activeTab === 'profile'      && <ProfileTab />}
        {activeTab === 'integrations' && <IntegrationsTab />}
      </div>
    </div>
  );
}