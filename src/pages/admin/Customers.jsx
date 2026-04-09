import { useState } from 'react';
import { Eye, Search, ArrowUp, ArrowDown, ArrowUpDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerService, customerKeys } from '../../services/customerService';
// ── ADDED: Import tenantService to fetch dynamic CRMs ──
import { tenantService, tenantKeys } from '../../services/tenantService';
import { crmBadgeClass, getInitials, getAvatarColor } from '../../utils/helpers';

const PAGE_SIZE = 20;

export default function Customers() {
  const navigate = useNavigate();

  const [search,       setSearch]       = useState('');
  const [sourceFilter, setSourceFilter] = useState(''); // ── ADDED: Source filter state ──
  const [sortField,    setSortField]    = useState('');
  const [sortDir,      setSortDir]      = useState('asc');
  const [page,         setPage]         = useState(1);

  // ── Fetch dynamic CRM sources for the filters ────────────────────────────
  const { data: sourceSystems = [], isLoading: isSourceLoading } = useQuery({
    queryKey: tenantKeys.sourceSystems(),
    queryFn: () => tenantService.getSourceSystems(),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  // ── Query ─────────────────────────────────────────────────────────────────
  // Note: if your customerService supports backend filtering by source, 
  // you can pass `source: sourceFilter` here.
  const queryParams = { 
    page, 
    page_size: PAGE_SIZE,
    ...(sourceFilter ? { source: sourceFilter } : {})
  };

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: customerKeys.list(queryParams),
    queryFn:  () => customerService.getAll(queryParams),
    placeholderData: (prev) => prev,  // keep previous page visible while fetching next
    staleTime: 30_000,
  });

  const customers  = data?.items       ?? [];
  const pagination = {
    total:       data?.total       ?? 0,
    total_pages: data?.total_pages ?? 1,
  };

  // ── Client-side search + filter + sort on the current page ────────────────
  const filtered = customers.filter(c => {
    // 1. Check CRM filter
    if (sourceFilter) {
      // Normalize comparison in case DB returns varying cases
      const crmMatch = String(c.crm || c.source_system || '').toLowerCase() === String(sourceFilter).toLowerCase();
      if (!crmMatch) return false;
    }
    
    // 2. Check Search query
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.crm?.toLowerCase().includes(q)
      );
    }

    return true;
  });

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

  const clearFilters = () => {
    setSearch('');
    setSourceFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || sourceFilter);

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
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          <a href="/admin/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</a> ›{' '}
          <span style={{ color: 'var(--text-primary)' }}>Customers</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Customers</h2>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ height: 13, width: '40%', borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite' }} />
              <div style={{ height: 11, width: '60%', borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite' }} />
            </div>
            <div style={{ width: 70, height: 22, borderRadius: 99, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          </div>
        ))}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Breadcrumb + title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            <a href="/admin/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</a> ›{' '}
            <span style={{ color: 'var(--text-primary)' }}>Customers</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Customers</h2>
        </div>
        {/* Subtle background-refetch indicator */}
        {isFetching && !isLoading && (
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--primary)', opacity: 0.6,
            animation: 'pulse 1s ease-in-out infinite',
          }} />
        )}
      </div>

      {/* Error banner */}
      {isError && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: '#FEF2F2', border: '1px solid #FCA5A5',
          color: '#DC2626', fontSize: 13.5,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{error?.message ?? 'Failed to load customers.'}</span>
          <button
            onClick={() => refetch()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 600, fontFamily: 'inherit' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Search + Filters Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="card" style={{ padding: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32, width: '100%' }}
              placeholder="Search by name, email or CRM…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* CRM Source Filter (Dynamically Loaded) */}
          <select
            value={sourceFilter}
            onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
            disabled={isSourceLoading}
            style={{
              appearance: 'none', padding: '8px 28px 8px 12px',
              border: `1px solid ${sourceFilter ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              background: sourceFilter ? 'var(--primary-light)' : 'var(--surface)',
              fontSize: 13.5, color: sourceFilter ? 'var(--primary)' : 'var(--text-primary)',
              cursor: isSourceLoading ? 'not-allowed' : 'pointer', 
              outline: 'none', fontFamily: 'inherit',
              fontWeight: sourceFilter ? 600 : 400, minWidth: 160,
              opacity: isSourceLoading ? 0.7 : 1,
            }}
          >
            <option value="">{isSourceLoading ? 'Loading Sources...' : 'All CRM Systems'}</option>
            {sourceSystems.map(system => {
              const label = system.system_name.toLowerCase() === 'espocrm' 
                ? 'EspoCRM' 
                : system.system_name.charAt(0).toUpperCase() + system.system_name.slice(1);
              return (
                <option key={system.id} value={system.system_name}>
                  {label}
                </option>
              );
            })}
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 12px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', background: 'transparent',
                cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Active Filter Pills */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Active Filters:</span>
            {[
              sourceFilter && { label: `CRM: ${sourceFilter}`, onRemove: () => { setSourceFilter(''); setPage(1); } },
              search       && { label: `Search: ${search}`,    onRemove: () => { setSearch(''); setPage(1); } },
            ].filter(Boolean).map(({ label, onRemove }) => (
              <div key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px',
                backgroundColor: 'var(--primary-light)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12, color: 'var(--primary)', fontWeight: 500,
              }}>
                {label}
                <button
                  onClick={onRemove}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center' }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th {...thSort('name')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>CUSTOMER <SortIcon field="name" /></span>
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
                    {hasActiveFilters ? 'No customers match your filters.' : 'No customers found.'}
                  </td>
                </tr>
              ) : sorted.map((c, i) => (
                <tr
                  key={c.id}
                  className="animate-in"
                  style={{ cursor: 'pointer', animationDelay: `${i * 0.03}s` }}
                  onClick={() => navigate(`/admin/customers/${c.id}`, { state: { customer: c } })}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: getAvatarColor(c.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                        {getInitials(c.name)}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{c.email || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{c.phone || '—'}</td>
                  <td><span className={crmBadgeClass(c.crm || c.source_system)}>{c.crm || c.source_system}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '5px 8px' }}
                      onClick={() => navigate(`/admin/customers/${c.id}`, { state: { customer: c } })}
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer + pagination */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          fontSize: 13, color: 'var(--text-secondary)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>
            {pagination.total} customer{pagination.total !== 1 ? 's' : ''} total
            {hasActiveFilters ? ` — ${sorted.length} shown` : ''}
          </span>
          {pagination.total_pages > 1 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page <= 1 || isFetching}
                style={{ padding: '4px 10px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
              >
                ‹ Prev
              </button>
              <span>Page {page} of {pagination.total_pages}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= pagination.total_pages || isFetching}
                style={{ padding: '4px 10px', cursor: page >= pagination.total_pages ? 'not-allowed' : 'pointer' }}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}