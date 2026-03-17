import { useState, useEffect } from 'react';
import { Eye, Edit2, Trash2, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { accountService } from '../../services/accountService';
import { crmBadgeClass, formatDate, getInitials } from '../../utils/helpers';

export const ACCOUNTS_DATA = [
  { id: 1, name: 'Global Industries Inc',    email: 'support@globalindustries.com', phone: '+1 (555) 345-6789', crm: 'EspoCRM', tickets: 45, updated: '2025-01-15', industry: 'Manufacturing',  website: 'globalindustries.com',  address: '123 Industrial Ave, New York, NY' },
  { id: 2, name: 'Digital Dynamics',         email: 'info@digitaldynamics.com',     phone: '+1 (555) 456-7890', crm: 'Zammad',  tickets: 12, updated: '2026-02-01', industry: 'Technology',     website: 'digitaldynamics.com',   address: '456 Tech Blvd, San Francisco, CA' },
  { id: 3, name: 'Innovation Labs',          email: 'contact@innovationlabs.com',   phone: '+1 (555) 567-8901', crm: 'EspoCRM', tickets: 31, updated: '2025-10-05', industry: 'R&D',            website: 'innovationlabs.com',    address: '789 Research Dr, Boston, MA' },
  { id: 4, name: 'CloudTech Systems',        email: 'admin@cloudtech.com',          phone: '+1 (555) 678-9012', crm: 'Zammad',  tickets: 8,  updated: '2026-01-25', industry: 'Cloud Services', website: 'cloudtech.com',         address: '321 Cloud St, Austin, TX' },
  { id: 5, name: 'Enterprise Solutions Group', email: 'contact@esg.com',            phone: '+1 (555) 789-0123', crm: 'EspoCRM', tickets: 56, updated: '2025-09-12', industry: 'Consulting',     website: 'esg.com',               address: '654 Enterprise Way, Chicago, IL' },
  { id: 6, name: 'Nexus Technologies',       email: 'info@nexustech.io',            phone: '+1 (555) 890-1234', crm: 'Zammad',  tickets: 22, updated: '2026-02-10', industry: 'Technology',     website: 'nexustech.io',          address: '987 Nexus Ln, Seattle, WA' },
  { id: 7, name: 'Acme Corporation',         email: 'hello@acme.com',               phone: '+1 (555) 901-2345', crm: 'EspoCRM', tickets: 19, updated: '2026-01-08', industry: 'Retail',         website: 'acme.com',              address: '147 Main St, Phoenix, AZ' },
  { id: 8, name: 'TechBridge Inc',           email: 'info@techbridge.com',          phone: '+1 (555) 012-3456', crm: 'Zammad',  tickets: 7,  updated: '2025-12-20', industry: 'IT Services',    website: 'techbridge.com',        address: '258 Bridge Ave, Denver, CO' },
];

export default function Accounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    accountService.getAll({})
      .then(r => setAccounts(r.data?.items || r.data))
      .catch(() => setAccounts(ACCOUNTS_DATA));
  }, []);

  const raw = accounts || ACCOUNTS_DATA;

  const filtered = raw.filter(a =>
    !search ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = sortField ? [...filtered].sort((a, b) => {
    let av = a[sortField], bv = b[sortField];
    if (sortField === 'tickets') { av = Number(av); bv = Number(bv); }
    if (sortField === 'updated')  { av = new Date(av); bv = new Date(bv); }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  }) : filtered;

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={13} style={{ opacity: 0.35, marginLeft: 4 }} />;
    return sortDir === 'asc' ? <ArrowUp size={13} style={{ marginLeft: 4, color: 'var(--primary)' }} /> : <ArrowDown size={13} style={{ marginLeft: 4, color: 'var(--primary)' }} />;
  };

  const thSort = (field) => ({
    style: { cursor: 'pointer', userSelect: 'none', color: sortField === field ? 'var(--primary)' : undefined, background: sortField === field ? '#EFF6FF' : undefined },
    onClick: () => handleSort(field),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            <a href="/admin/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</a> › <span style={{ color: 'var(--text-primary)' }}>Accounts</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Accounts</h2>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 32, width: '100%' }} placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th {...thSort('name')}><span style={{ display: 'flex', alignItems: 'center' }}>ACCOUNT <SortIcon field="name" /></span></th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>CRM</th>
                <th {...thSort('tickets')}><span style={{ display: 'flex', alignItems: 'center' }}>TICKETS <SortIcon field="tickets" /></span></th>
                <th {...thSort('updated')}><span style={{ display: 'flex', alignItems: 'center' }}>LAST UPDATED <SortIcon field="updated" /></span></th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a, i) => (
                <tr
                  key={a.id}
                  className="animate-in"
                  style={{ cursor: 'pointer', animationDelay: `${i * 0.04}s` }}
                  onClick={() => navigate(`/admin/accounts/${a.id}`)}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                        {getInitials(a.name)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{a.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{a.email}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{a.phone}</td>
                  <td><span className={crmBadgeClass(a.crm)}>{a.crm}</span></td>
                  <td><span style={{ fontWeight: 600 }}>{a.tickets}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatDate(a.updated)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={() => navigate(`/admin/accounts/${a.id}`)}><Eye size={15} /></button>
                      <button className="btn btn-ghost" style={{ padding: '5px 8px' }}><Edit2 size={15} /></button>
                      <button className="btn btn-ghost" style={{ padding: '5px 8px', color: 'var(--danger)' }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
          Showing 1 to {sorted.length} of {sorted.length} accounts
        </div>
      </div>
    </div>
  );
}

