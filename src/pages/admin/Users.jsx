import { useState, useRef, useEffect } from 'react';
import { Eye, Edit2, UserX, Search, ArrowUp, ArrowDown, ArrowUpDown, MoreVertical, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userService, userKeys } from '../../services/userService';
import { getInitials, getAvatarColor, crmBadgeClass } from '../../utils/helpers';

const PAGE_SIZE = 20;

// Row action menu component
function RowActionMenu({ user, onClose, isOpen }) {
  const menuRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        bottom: -110,
        right: 0,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 100,
        minWidth: 140,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <button
        onClick={() => { navigate(`/admin/users/${user.id}`, { state: { user } }); onClose(); }}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: 13,
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Eye size={14} /> View
      </button>
      <button
        style={{
          width: '100%',
          padding: '10px 14px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: 13,
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'background 0.15s',
          borderTop: '1px solid var(--border-light)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Edit2 size={14} /> Edit
      </button>
      <button
        style={{
          width: '100%',
          padding: '10px 14px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: 13,
          color: 'var(--danger)',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'background 0.15s',
          borderTop: '1px solid var(--border-light)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <UserX size={14} /> Delete
      </button>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}

export default function Users() {
  const navigate = useNavigate();

  const [search,       setSearch]      = useState('');
  const [sortField,    setSortField]   = useState('');
  const [sortDir,      setSortDir]     = useState('asc');
  const [statusFilter, setStatus]      = useState('');
  const [page,         setPage]        = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [openMenuId,   setOpenMenuId]  = useState(null);

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

  const toggleRow = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === sorted.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sorted.map(u => u.id)));
    }
  };

  const hasActiveFilters = statusFilter || search;

  const clearFilters = () => {
    setStatus('');
    setSearch('');
    setPage(1);
  };

  // Get action button based on status
  const getActionButton = (user) => {
    const status = (user.status || '').toLowerCase();
    if (status === 'active') return null;
    if (status === 'not_invited') {
      return (
        <button
          className="btn"
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Send size={13} /> Invite
        </button>
      );
    }
    if (status === 'expired') {
      return (
        <button
          className="btn"
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            background: '#FF9500',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Reissued
        </button>
      );
    }
    if (status === 'pending') {
      return (
        <button
          className="btn"
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            background: '#FF6B6B',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >
          Report
        </button>
      );
    }
    return null;
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
            <div style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--border)', flexShrink: 0, animation: 'pulse 1.4s infinite' }} />
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

      {/* Search + filters + active filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
          <select
            value={statusFilter}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            style={{
              appearance: 'none', padding: '8px 28px 8px 12px',
              border: `1px solid ${statusFilter ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              background: statusFilter ? 'var(--primary-light)' : 'var(--surface)',
              fontSize: 13.5, color: statusFilter ? 'var(--primary)' : 'var(--text-primary)',
              cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
              fontWeight: statusFilter ? 600 : 400, minWidth: 140,
            }}
          >
            <option value="">Status: All</option>
            <option value="active">Status: Active</option>
            <option value="not_invited">Status: Not Invited</option>
            <option value="pending">Status: Pending</option>
            <option value="expired">Status: Expired</option>
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--text-secondary)',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--surface-2)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Active Filters:</span>
            {statusFilter && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  backgroundColor: 'var(--primary-light)',
                  border: '1px solid var(--primary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  color: 'var(--primary)',
                  fontWeight: 500,
                }}
              >
                Status: {statusFilter}
                <button
                  onClick={() => setStatus('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'var(--primary)',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {search && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  backgroundColor: 'var(--primary-light)',
                  border: '1px solid var(--primary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  color: 'var(--primary)',
                  fontWeight: 500,
                }}
              >
                Search: {search}
                <button
                  onClick={() => setSearch('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'var(--primary)',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedRows.size > 0 && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--primary-light)',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>
            {selectedRows.size} user{selectedRows.size !== 1 ? 's' : ''} selected
          </span>
          <button
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Send size={14} /> Invite Users ({selectedRows.size})
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: 'center', cursor: 'pointer' }} onClick={toggleAllRows}>
                  <input
                    type="checkbox"
                    checked={selectedRows.size === sorted.length && sorted.length > 0}
                    onChange={toggleAllRows}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th {...thSort('name')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>USER NAME <SortIcon field="name" /></span>
                </th>
                <th>EMAIL</th>
                <th {...thSort('status')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>STATUS <SortIcon field="status" /></span>
                </th>
                <th>TICKETS</th>
                <th>CRM</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    {users.length === 0 ? 'No users found.' : 'No users match your filters.'}
                  </td>
                </tr>
              ) : sorted.map((u, i) => (
                <tr
                  key={u.id}
                  className="animate-in"
                  style={{ 
                    cursor: 'pointer',
                    animationDelay: `${i * 0.04}s`,
                    background: selectedRows.has(u.id) ? 'var(--primary-light)' : 'transparent',
                  }}
                >
                  <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(u.id)}
                      onChange={() => toggleRow(u.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td onClick={() => navigate(`/admin/users/${u.id}`, { state: { user: u } })}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: getAvatarColor(u.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                        {getInitials(u.name)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }} onClick={() => navigate(`/admin/users/${u.id}`, { state: { user: u } })}>
                    {u.email || '—'}
                  </td>
                  <td onClick={() => navigate(`/admin/users/${u.id}`, { state: { user: u } })}>
                    <span className={`badge ${(u.status || '').toLowerCase() === 'active' ? 'badge-active' : u.status?.toLowerCase() === 'not_invited' ? 'badge-inactive' : 'badge-pending'}`}>
                      {u.status || 'Active'}
                    </span>
                  </td>
                  <td onClick={() => navigate(`/admin/users/${u.id}`, { state: { user: u } })} style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>
                    {u.tickets || 0}
                  </td>
                  <td onClick={() => navigate(`/admin/users/${u.id}`, { state: { user: u } })}>
                    {u.crm ? <span className={crmBadgeClass(u.crm)}>{u.crm}</span> : '—'}
                  </td>
                  <td onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {getActionButton(u)}
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '5px 8px', position: 'relative' }}
                        onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                      >
                        <MoreVertical size={16} />
                      </button>
                      <RowActionMenu
                        user={u}
                        isOpen={openMenuId === u.id}
                        onClose={() => setOpenMenuId(null)}
                      />
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
            Showing {sorted.length} of {pagination.total} user{pagination.total !== 1 ? 's' : ''}
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
