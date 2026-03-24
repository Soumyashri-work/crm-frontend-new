import { useState, useEffect } from 'react';
import { Eye, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { accountService } from '../../services/accountService';
import { crmBadgeClass, getInitials } from '../../utils/helpers';

export default function Accounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir]     = useState('asc');
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const PAGE_SIZE = 20;

  const fetchAccounts = async (currentPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountService.getAll({ page: currentPage, page_size: PAGE_SIZE });
      setAccounts(data.items ?? []);
      setPagination({ total: data.total ?? 0, total_pages: data.total_pages ?? 1 });
    } catch (err) {
      setError('Failed to load accounts.');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(1); }, []);

  const filtered = accounts.filter(a =>
    !search ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.crm?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = sortField ? [...filtered].sort((a, b) => {
    let av = a[sortField] ?? '', bv = b[sortField] ?? '';
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ?  1 : -1;
    return 0;
  }) : filtered;

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={13} style={{ opacity: 0.35, marginLeft: 4 }} />;
    return sortDir === 'asc'
      ? <ArrowUp   size={13} style={{ marginLeft: 4, color: 'var(--primary)' }} />
      : <ArrowDown size={13} style={{ marginLeft: 4, color: 'var(--primary)' }} />;
  };

  const thSort = (field) => ({
    style: {
      cursor: 'pointer', userSelect: 'none',
      color:      sortField === field ? 'var(--primary)' : undefined,
      background: sortField === field ? '#EFF6FF'        : undefined,
    },
    onClick: () => handleSort(field),
  });

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          <a href="/admin/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</a> ›{' '}
          <span style={{ color: 'var(--text-primary)' }}>Accounts</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Accounts</h2>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ height: 13, width: '45%', borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite' }} />
              <div style={{ height: 11, width: '65%', borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite' }} />
            </div>
            <div style={{ width: 70, height: 22, borderRadius: 99, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          </div>
        ))}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Breadcrumb + title */}
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          <a href="/admin/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</a> ›{' '}
          <span style={{ color: 'var(--text-primary)' }}>Accounts</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Accounts</h2>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 13.5, display: 'flex', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button onClick={() => fetchAccounts(page)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 600, fontFamily: 'inherit' }}>Retry</button>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>

        {/* Search */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32, width: '100%' }}
              placeholder="Search by name, email or CRM…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th {...thSort('name')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>ACCOUNT <SortIcon field="name" /></span>
                </th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>CRM</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    {search ? 'No accounts match your search.' : 'No accounts found.'}
                  </td>
                </tr>
              ) : sorted.map((a, i) => (
                <tr
                  key={a.id}
                  className="animate-in"
                  style={{ cursor: 'pointer', animationDelay: `${i * 0.03}s` }}
                  onClick={() => navigate(`/admin/accounts/${a.id}`)}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                        {getInitials(a.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{a.email || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{a.phone || '—'}</td>
                  <td><span className={crmBadgeClass(a.crm)}>{a.crm}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={() => navigate(`/admin/accounts/${a.id}`)}>
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{pagination.total} account{pagination.total !== 1 ? 's' : ''} total{search ? ` — ${sorted.length} shown` : ''}</span>
          {pagination.total_pages > 1 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => { setPage(p => p - 1); fetchAccounts(page - 1); }} disabled={page <= 1} style={{ padding: '4px 10px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>‹ Prev</button>
              <span>Page {page} of {pagination.total_pages}</span>
              <button onClick={() => { setPage(p => p + 1); fetchAccounts(page + 1); }} disabled={page >= pagination.total_pages} style={{ padding: '4px 10px', cursor: page >= pagination.total_pages ? 'not-allowed' : 'pointer' }}>Next ›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}