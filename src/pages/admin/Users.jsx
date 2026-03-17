import { useState, useEffect } from 'react';
import { Eye, Edit2, UserX, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { crmBadgeClass, getInitials, getAvatarColor } from '../../utils/helpers';

export const USERS_DATA = [
  { id: 1, name: 'Alex Brown',       email: 'alex.brown@company.com',      role: 'Agent', status: 'Active',   tickets: 18, crm: 'EspoCRM', joined: '2024-03-01', phone: '+1 (555) 101-2020' },
  { id: 2, name: 'John Anderson',    email: 'john.anderson@company.com',   role: 'Admin', status: 'Active',   tickets: 0,  crm: 'EspoCRM', joined: '2023-11-15', phone: '+1 (555) 202-3030' },
  { id: 3, name: 'Jessica Williams', email: 'jessica.williams@company.com',role: 'Agent', status: 'Active',   tickets: 10, crm: 'Zammad',  joined: '2024-01-20', phone: '+1 (555) 303-4040' },
  { id: 4, name: 'Robert Taylor',    email: 'robert.taylor@company.com',   role: 'Agent', status: 'Inactive', tickets: 0,  crm: 'EspoCRM', joined: '2023-08-10', phone: '+1 (555) 404-5050' },
  { id: 5, name: 'Emma Davis',       email: 'emma.davis@company.com',      role: 'Admin', status: 'Active',   tickets: 0,  crm: 'Zammad',  joined: '2023-12-05', phone: '+1 (555) 505-6060' },
  { id: 6, name: 'Daniel Martinez',  email: 'daniel.martinez@company.com', role: 'Agent', status: 'Active',   tickets: 14, crm: 'EspoCRM', joined: '2024-02-14', phone: '+1 (555) 606-7070' },
  { id: 7, name: 'Sarah Chen',       email: 'sarah.chen@company.com',      role: 'Agent', status: 'Active',   tickets: 22, crm: 'Zammad',  joined: '2023-09-22', phone: '+1 (555) 707-8080' },
  { id: 8, name: 'Mike Johnson',     email: 'mike.johnson@company.com',    role: 'Agent', status: 'Active',   tickets: 9,  crm: 'EspoCRM', joined: '2024-04-03', phone: '+1 (555) 808-9090' },
];

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    userService.getAll()
      .then(r => setUsers(r.data?.items || r.data))
      .catch(() => setUsers(USERS_DATA));
  }, []);

  const raw = users || USERS_DATA;

  const filtered = raw.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter && u.status !== statusFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
    return sortDir === 'asc'
      ? <ArrowUp size={13} style={{ marginLeft: 4, color: 'var(--primary)' }} />
      : <ArrowDown size={13} style={{ marginLeft: 4, color: 'var(--primary)' }} />;
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
            <span onClick={() => navigate('/admin/dashboard')} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color='var(--primary)'} onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>Dashboard</span>
            {' › '}<span style={{ color: 'var(--text-primary)' }}>Users</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Users</h2>
        </div>
        <button className="btn btn-primary">+ Add User</button>
      </div>

      {/* Search + filters */}
      <div className="card" style={{ padding: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 32, width: '100%' }} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {[
          { value: roleFilter, set: setRoleFilter, placeholder: 'All Roles', opts: ['Admin', 'Agent'] },
          { value: statusFilter, set: setStatusFilter, placeholder: 'All Status', opts: ['Active', 'Inactive'] },
        ].map(({ value, set, placeholder, opts }) => (
          <div key={placeholder} style={{ position: 'relative' }}>
            <select value={value} onChange={e => set(e.target.value)} style={{ appearance: 'none', padding: '8px 28px 8px 12px', border: `1px solid ${value ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', background: value ? 'var(--primary-light)' : 'var(--surface)', fontSize: 13.5, color: value ? 'var(--primary)' : 'var(--text-primary)', cursor: 'pointer', outline: 'none', fontFamily: 'inherit', fontWeight: value ? 600 : 400, minWidth: 120 }}>
              <option value="">{placeholder}</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th {...thSort('name')}><span style={{ display: 'flex', alignItems: 'center' }}>USER <SortIcon field="name" /></span></th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th {...thSort('tickets')}><span style={{ display: 'flex', alignItems: 'center' }}>TICKETS <SortIcon field="tickets" /></span></th>
                <th>CRM</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((u, i) => (
                <tr key={u.id} className="animate-in" style={{ cursor: 'pointer', animationDelay: `${i * 0.04}s` }}
                  onClick={() => navigate(`/admin/users/${u.id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: getAvatarColor(u.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                        {getInitials(u.name)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{u.email}</td>
                  <td><span className={`badge ${u.role === 'Admin' ? 'badge-admin' : 'badge-agent'}`}>{u.role}</span></td>
                  <td><span className={`badge ${u.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>{u.status}</span></td>
                  <td style={{ fontWeight: 600 }}>{u.tickets}</td>
                  <td><span className={crmBadgeClass(u.crm)}>{u.crm}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={() => navigate(`/admin/users/${u.id}`)}><Eye size={15} /></button>
                      <button className="btn btn-ghost" style={{ padding: '5px 8px' }}><Edit2 size={15} /></button>
                      <button className="btn btn-ghost" style={{ padding: '5px 8px', color: 'var(--danger)' }}><UserX size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
          Showing {sorted.length} of {raw.length} users
        </div>
      </div>
    </div>
  );
}
