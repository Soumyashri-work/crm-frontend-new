import { useState } from 'react';
import { Eye, Edit2, UserX, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userService, userKeys } from '../../services/userService';
import { getInitials, getAvatarColor } from '../../utils/helpers';

const PAGE_SIZE = 20;

export default function Users() {
  const navigate = useNavigate();

  const [search,       setSearch]      = useState('');
  const [sortField,    setSortField]   = useState('');
  const [sortDir,      setSortDir]     = useState('asc');
  const [roleFilter,   setRoleFilter]  = useState('');
  const [statusFilter, setStatus]      = useState('');
  const [page,         setPage]        = useState(1);

  // ── Query ─────────────────────────────────────────────────────────────────
  const queryParams = { page, page_size: PAGE_SIZE };

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: userKeys.list(queryParams),
    queryFn:  () => userService.getAll(queryParams),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const users      = data?.items       ?? [];
  const pagination = {
    total:       data?.total       ?? 0,
    total_pages: data?.total_pages ?? 1,
  };

  // ── Client-side filter + sort ─────────────────────────────────────────────
  const filtered = users.filter(u => {
    if (roleFilter   && (u.role   || '').toLowerCase() !== roleFilter.toLowerCase())   return false;
    if (statusFilter && (u.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(u.name || '').toLowerCase().includes(q) && !(u.email || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const sorted = sortField ? [...filtered].sort((a, b) => {
    let av = String(a[sortField] ?? '').toLowerCase();
    let bv = String(b[sortField] ?? '').toLowerCase();
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

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ height: 28, width: 100, borderRadius: 6, background: 'var(--border)', animation: 'pulse 1.4s infinite' }} />
      <div className="card" style={{ overflow: 'hidden' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--border)', flexShrink: 0, animation: 'pulse 1.4s infinite' }} />
            <div style={{ flex: 1, height: 13, borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.4s infinite' }} />
            <div style={{ width: 60, height: 22, borderRadius: 99, background: 'var(--border)', animation: 'pulse 1.4s infinite' }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span
              onClick={() => navigate('/admin/dashboard')}
              style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Dashboard
            </span>
            {' › '}<span style={{ color: 'var(--text-primary)' }}>Users</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Users</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isFetching && !isLoading && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', opacity: 0.6, animation: 'pulse 1s ease-in-out infinite' }} />
          )}
          <button className="btn btn-primary">+ Add User</button>
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: '#FEF2F2', border: '1px solid #FCA5A5',
          color: '#DC2626', fontSize: 13.5,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{error?.message ?? 'Failed to load users.'}</span>
          <button onClick={() => refetch()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 600, fontFamily: 'inherit' }}>
            Retry
          </button>
        </div>
      )}

      {/* Search + filters */}
      <div className="card" style={{ padding: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 32, width: '100%' }}
            placeholder="Search users…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {[
          { value: roleFilter,   set: setRoleFilter, placeholder: 'All Roles',  opts: ['Admin', 'Agent'] },
          { value: statusFilter, set: setStatus,     placeholder: 'All Status', opts: ['Active', 'Inactive'] },
        ].map(({ value, set, placeholder, opts }) => (
          <select
            key={placeholder}
            value={value}
            onChange={e => { set(e.target.value); setPage(1); }}
            style={{
              appearance: 'none', padding: '8px 28px 8px 12px',
              border: `1px solid ${value ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              background: value ? 'var(--primary-light)' : 'var(--surface)',
              fontSize: 13.5, color: value ? 'var(--primary)' : 'var(--text-primary)',
              cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
              fontWeight: value ? 600 : 400, minWidth: 120,
            }}
          >
            <option value="">{placeholder}</option>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
      </div>

      {/* Table — no Tickets column (dashboard users only) */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th {...thSort('name')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>USER <SortIcon field="name" /></span>
                </th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th {...thSort('status')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>STATUS <SortIcon field="status" /></span>
                </th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    {users.length === 0 ? 'No users found.' : 'No users match your filters.'}
                  </td>
                </tr>
              ) : sorted.map((u, i) => (
                <tr
                  key={u.id}
                  className="animate-in"
                  style={{ cursor: 'pointer', animationDelay: `${i * 0.04}s` }}
                  onClick={() => navigate(`/admin/users/${u.id}`, { state: { user: u } })}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: getAvatarColor(u.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                        {getInitials(u.name)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{u.email || '—'}</td>
                  <td>
                    <span className={`badge ${(u.role || '').toLowerCase() === 'admin' ? 'badge-admin' : 'badge-agent'}`}>
                      {u.role || 'Agent'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${(u.status || '').toLowerCase() === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                      {u.status || 'Active'}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={() => navigate(`/admin/users/${u.id}`, { state: { user: u } })}>
                        <Eye size={15} />
                      </button>
                      <button className="btn btn-ghost" style={{ padding: '5px 8px' }}><Edit2 size={15} /></button>
                      <button className="btn btn-ghost" style={{ padding: '5px 8px', color: 'var(--danger)' }}><UserX size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          fontSize: 13, color: 'var(--text-secondary)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>
            {pagination.total} user{pagination.total !== 1 ? 's' : ''} total
            {search || roleFilter || statusFilter ? ` — ${sorted.length} shown` : ''}
          </span>
          {pagination.total_pages > 1 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1 || isFetching} style={{ padding: '4px 10px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>‹ Prev</button>
              <span>Page {page} of {pagination.total_pages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.total_pages || isFetching} style={{ padding: '4px 10px', cursor: page >= pagination.total_pages ? 'not-allowed' : 'pointer' }}>Next ›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
