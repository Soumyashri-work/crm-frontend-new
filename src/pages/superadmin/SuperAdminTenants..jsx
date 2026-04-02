import { useState } from 'react';
import { Search, Plus, Building2, ChevronDown, MoreVertical } from 'lucide-react';
import AddTenantModal from '../../components/superadmin/AddTenantModal';

const MOCK_TENANTS = [
  { id: 1, name: 'Global Industries Corp',    domain: 'globalindustries.crm.com', contactEmail: 'admin@globalindustries.com', status: 'Active',   admins: 5, users: 124, tickets: 2456 },
  { id: 2, name: 'TechBridge Solutions',      domain: 'techbridge.crm.com',       contactEmail: 'admin@techbridge.com',       status: 'Active',   admins: 2, users: 45,  tickets: 678  },
  { id: 3, name: 'Innovation Labs Inc',       domain: 'innovationlabs.crm.com',   contactEmail: 'admin@innovationlabs.com',   status: 'Active',   admins: 8, users: 256, tickets: 5234 },
  { id: 4, name: 'Digital Dynamics',          domain: 'digitaldynamics.crm.com',  contactEmail: 'admin@digitaldynamics.com',  status: 'Active',   admins: 3, users: 89,  tickets: 1234 },
  { id: 5, name: 'CloudTech Services',        domain: 'cloudtech.crm.com',        contactEmail: 'admin@cloudtech.com',        status: 'Inactive', admins: 1, users: 12,  tickets: 156  },
  { id: 6, name: 'Enterprise Solutions Group',domain: 'esg.crm.com',              contactEmail: 'admin@esg.com',              status: 'Active',   admins: 6, users: 198, tickets: 3456 },
  { id: 7, name: 'Acme Corporation',          domain: 'acmecorp.crm.com',         contactEmail: 'admin@acmecorp.com',         status: 'Active',   admins: 4, users: 67,  tickets: 987  },
  { id: 8, name: 'NexusTech Industries',      domain: 'nexustech.crm.com',        contactEmail: 'admin@nexustech.io',         status: 'Inactive', admins: 1, users: 8,   tickets: 45   },
];

export default function SuperAdminTenants() {
  const [tenants, setTenants]           = useState(MOCK_TENANTS);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal]       = useState(false);

  const filtered = tenants.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.contactEmail.toLowerCase().includes(q) ||
        t.domain.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddTenant = (formData) => {
    setTenants(prev => [{
      id:           Date.now(),
      name:         formData.name,
      domain:       '',
      contactEmail: formData.contactEmail,
      status:       'Active',
      admins:       0,
      users:        0,
      tickets:      0,
    }, ...prev]);
    setShowModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Dashboard</span>
            <span style={{ margin: '0 6px' }}>›</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Tenants</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Tenants</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>
            Manage all tenant organizations
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', fontSize: 14 }}
        >
          <Plus size={16} /> Add Tenant
        </button>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36, width: '100%' }}
            placeholder="Search tenants..."
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
                <th>TENANT</th>
                <th>CONTACT EMAIL</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'center' }}>ADMINS</th>
                <th style={{ textAlign: 'center' }}>USERS</th>
                <th style={{ textAlign: 'center' }}>TICKETS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    {search || statusFilter ? 'No tenants match your search.' : 'No tenants found.'}
                  </td>
                </tr>
              ) : filtered.map((t, i) => (
                <tr key={t.id} className="animate-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={17} color="white" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                        {t.domain && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.domain}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{t.contactEmail || '—'}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                      background: t.status === 'Active' ? '#ECFDF5' : '#FEF2F2',
                      color:      t.status === 'Active' ? '#059669' : '#DC2626',
                    }}>
                      {t.status === 'Active' && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                      )}
                      {t.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{t.admins}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{t.users.toLocaleString()}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{t.tickets.toLocaleString()}</td>
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
          Showing {filtered.length} of {tenants.length} tenants
        </div>
      </div>

      <AddTenantModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddTenant}
      />
    </div>
  );
}