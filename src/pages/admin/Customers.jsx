import { useState, useEffect } from 'react';
import { Eye, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { crmBadgeClass, getInitials, getAvatarColor } from '../../utils/helpers';

export const CUSTOMERS_DATA = [
  { id: 1,  name: 'David Lee',       email: 'david.lee@globalindustries.com',  phone: '+1 (555) 333-4444', account: 'Global Industries Inc',     accountId: 1, crm: 'EspoCRM', tickets: 12 },
  { id: 2,  name: 'Alex Brown',      email: 'alex.brown@digitaldynamics.com',  phone: '+1 (555) 444-5555', account: 'Digital Dynamics',          accountId: 2, crm: 'Zammad',  tickets: 3  },
  { id: 3,  name: 'Sarah Kim',       email: 'sarah.kim@innovationlabs.com',    phone: '+1 (555) 555-6666', account: 'Innovation Labs',           accountId: 3, crm: 'EspoCRM', tickets: 10 },
  { id: 4,  name: 'Michael Chen',    email: 'michael.chen@cloudtech.com',      phone: '+1 (555) 666-7777', account: 'CloudTech Systems',         accountId: 4, crm: 'Zammad',  tickets: 2  },
  { id: 5,  name: 'Lisa Anderson',   email: 'lisa.a@esg.com',                  phone: '+1 (555) 777-8888', account: 'Enterprise Solutions Group',accountId: 5, crm: 'EspoCRM', tickets: 15 },
  { id: 6,  name: 'Tom Wilson',      email: 'tom.w@acmecorp.com',              phone: '+1 (555) 888-9999', account: 'Acme Corporation',          accountId: 7, crm: 'EspoCRM', tickets: 6  },
  { id: 7,  name: 'Rachel Green',    email: 'rachel.green@nexustech.io',       phone: '+1 (555) 999-0000', account: 'Nexus Technologies',        accountId: 6, crm: 'Zammad',  tickets: 7  },
  { id: 8,  name: 'Carlos Martinez', email: 'carlos.m@globalindustries.com',   phone: '+1 (555) 000-1111', account: 'Global Industries Inc',     accountId: 1, crm: 'EspoCRM', tickets: 9  },
  { id: 9,  name: 'Emma Johnson',    email: 'emma.j@techbridge.com',           phone: '+1 (555) 111-2222', account: 'TechBridge Inc',            accountId: 8, crm: 'Zammad',  tickets: 4  },
  { id: 10, name: 'James Wilson',    email: 'james.w@innovationlabs.com',      phone: '+1 (555) 222-3333', account: 'Innovation Labs',           accountId: 3, crm: 'EspoCRM', tickets: 8  },
];

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    customerService.getAll({})
      .then(r => setCustomers(r.data?.items || r.data))
      .catch(() => setCustomers(CUSTOMERS_DATA));
  }, []);

  const raw = customers || CUSTOMERS_DATA;

  const filtered = raw.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.account?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = sortField ? [...filtered].sort((a, b) => {
    let av = a[sortField], bv = b[sortField];
    if (sortField === 'tickets') { av = Number(av); bv = Number(bv); }
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
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          <a href="/admin/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</a> › <span style={{ color: 'var(--text-primary)' }}>Customers</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Customers</h2>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 32, width: '100%' }} placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th {...thSort('name')}><span style={{ display: 'flex', alignItems: 'center' }}>CUSTOMER <SortIcon field="name" /></span></th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>ACCOUNT</th>
                <th>CRM</th>
                <th {...thSort('tickets')}><span style={{ display: 'flex', alignItems: 'center' }}>TICKETS <SortIcon field="tickets" /></span></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => (
                <tr key={c.id} className="animate-in" style={{ cursor: 'pointer', animationDelay: `${i * 0.04}s` }}
                  onClick={() => navigate(`/admin/customers/${c.id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: getAvatarColor(c.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                        {getInitials(c.name)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{c.email}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{c.phone}</td>
                  <td>
                    <span style={{ fontSize: 13.5, color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
                      onClick={e => { e.stopPropagation(); navigate(`/admin/accounts/${c.accountId}`); }}>
                      {c.account}
                    </span>
                  </td>
                  <td><span className={crmBadgeClass(c.crm)}>{c.crm}</span></td>
                  <td><span style={{ fontWeight: 600 }}>{c.tickets}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={() => navigate(`/admin/customers/${c.id}`)}><Eye size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
          Showing 1 to {sorted.length} of {sorted.length} customers
        </div>
      </div>
    </div>
  );
}
