import { useState } from 'react';
import { Search, Plus, ChevronDown, MoreVertical } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import AddAdminModal from '../../components/superadmin/AddAdminModal';

const MOCK_ADMINS = [
  { id: 1,  name: 'John Anderson',   email: 'john@globalindustries.com',  tenant: 'Global Industries Corp',     tenantDomain: 'globalindustries.crm.com', status: 'Active',   lastActive: '2024-03-26T10:30:00' },
  { id: 2,  name: 'Sarah Williams',  email: 'sarah@techbridge.com',       tenant: 'TechBridge Solutions',       tenantDomain: 'techbridge.crm.com',       status: 'Active',   lastActive: '2024-03-26T09:15:00' },
  { id: 3,  name: 'Michael Chen',    email: 'michael@innovationlabs.com', tenant: 'Innovation Labs Inc',        tenantDomain: 'innovationlabs.crm.com',   status: 'Active',   lastActive: '2024-03-26T11:45:00' },
  { id: 4,  name: 'Emma Thompson',   email: 'emma@globalindustries.com',  tenant: 'Global Industries Corp',     tenantDomain: 'globalindustries.crm.com', status: 'Active',   lastActive: '2024-03-25T16:20:00' },
  { id: 5,  name: 'David Lee',       email: 'david@digitaldynamics.com',  tenant: 'Digital Dynamics',           tenantDomain: 'digitaldynamics.crm.com',  status: 'Active',   lastActive: '2024-03-26T08:30:00' },
  { id: 6,  name: 'Lisa Anderson',   email: 'lisa@esg.com',               tenant: 'Enterprise Solutions Group', tenantDomain: 'esg.crm.com',              status: 'Active',   lastActive: '2024-03-26T12:00:00' },
  { id: 7,  name: 'Robert Martinez', email: 'robert@innovationlabs.com',  tenant: 'Innovation Labs Inc',        tenantDomain: 'innovationlabs.crm.com',   status: 'Active',   lastActive: '2024-03-26T10:00:00' },
  { id: 8,  name: 'Jennifer Davis',  email: 'jennifer@cloudtech.com',     tenant: 'CloudTech Services',         tenantDomain: 'cloudtech.crm.com',        status: 'Inactive', lastActive: '2024-03-20T14:30:00' },
  { id: 9,  name: 'Alex Brown',      email: 'alex@acmecorp.com',          tenant: 'Acme Corporation',           tenantDomain: 'acmecorp.crm.com',         status: 'Active',   lastActive: '2024-03-26T09:45:00' },
  { id: 10, name: 'Maria Garcia',    email: 'maria@globalindustries.com', tenant: 'Global Industries Corp',     tenantDomain: 'globalindustries.crm.com', status: 'Active',   lastActive: '2024-03-26T11:20:00' },
];

export default function SuperAdminAdmins({ tenants = [] }) {
  const [admins, setAdmins]             = useState(MOCK_ADMINS);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal]       = useState(false);

  const filtered = admins.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.tenant.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddAdmin = (formData) => {
    setAdmins(prev => [{
      id:           Date.now(),
      name:         formData.name,
      email:        formData.email,
      tenant:       formData.tenantName   || 'Unknown Tenant',
      tenantDomain: formData.tenantDomain || '',
      status:       'Active',
      lastActive:   new Date().toISOString(),
    }, ...prev]);
    setShowModal(false);
  };

  const formatLastActive = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Breadcrumb + header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Dashboard</span>
            <span style={{ margin: '0 6px' }}>›</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Admins</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Admins</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>
            Manage admin users across all tenants
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', fontSize: 14 }}
        >
          <Plus size={16} /> Add Admin
        </button>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36, width: '100%' }}
            placeholder="Search admins..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              appearance: 'none', padding: '9px 36px 9px 14px',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)', fontSize: 13.5,
              color: 'var(--text-primary)', cursor: 'pointer',
              outline: 'none', fontFamily: 'inherit', minWidth: 130,
            }}
          >
            <option value="">Status: All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ADMIN</th>
                <th>TENANT</th>
                <th>STATUS</th>
                <th>LAST ACTIVE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    {search || statusFilter ? 'No admins match your search.' : 'No admins found.'}
                  </td>
                </tr>
              ) : filtered.map((a, i) => (
                <tr key={a.id} className="animate-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: getAvatarColor(a.name),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: 'white',
                      }}>
                        {getInitials(a.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }}>{a.tenant}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.tenantDomain}</div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                      background: a.status === 'Active' ? '#ECFDF5' : '#FEF2F2',
                      color:      a.status === 'Active' ? '#059669' : '#DC2626',
                    }}>
                      {a.status === 'Active' && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                      )}
                      {a.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>
                    {formatLastActive(a.lastActive)}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '5px 8px' }}
                      onClick={e => e.preventDefault()}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
          Showing {filtered.length} of {admins.length} admins
        </div>
      </div>

      <AddAdminModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddAdmin}
        tenants={tenants}
      />
    </div>
  );
}