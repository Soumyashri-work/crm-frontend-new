import { useState } from 'react';
import { Search, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { customerService, customerKeys } from '../../services/customerService';
import { tenantService, tenantKeys } from '../../services/tenantService';
import { crmBadgeClass, getInitials, getAvatarColor } from '../../utils/helpers';

const PAGE_SIZE = 20;

export default function Customers() {

  const [search,       setSearch]       = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortField,    setSortField]    = useState('');
  const [sortDir,      setSortDir]      = useState('asc');
  const [page,         setPage]         = useState(1);

  const { data: sourceSystems = [], isLoading: isSourceLoading } = useQuery({
    queryKey: tenantKeys.sourceSystems(),
    queryFn:  () => tenantService.getSourceSystems(),
    staleTime: 5 * 60 * 1000,
  });

  const queryParams = { page, page_size: PAGE_SIZE, ...(sourceFilter ? { source: sourceFilter } : {}) };

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: customerKeys.list(queryParams),
    queryFn:  () => customerService.getAll(queryParams),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const customers  = data?.items ?? [];
  const pagination = { total: data?.total ?? 0, total_pages: data?.total_pages ?? 1 };

  const filtered = customers.filter(c => {
    if (sourceFilter) {
      const match = String(c.crm || c.source_system || '').toLowerCase() === String(sourceFilter).toLowerCase();
      if (!match) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.crm?.toLowerCase().includes(q);
    }
    return true;
  });

  const sorted = sortField ? [...filtered].sort((a, b) => {
    let av = a[sortField] ?? '', bv = b[sortField] ?? '';
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  }) : filtered;

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const hasActiveFilters = Boolean(search || sourceFilter);
  const clearFilters = () => { setSearch(''); setSourceFilter(''); setPage(1); };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={13} style={{ opacity: 0.35, marginLeft: 4 }} />;
    return sortDir === 'asc' ? <ArrowUp size={13} style={{ marginLeft: 4, color: 'var(--primary)' }} /> : <ArrowDown size={13} style={{ marginLeft: 4, color: 'var(--primary)' }} />;
  };

  const thSort = (field) => ({
    style: { cursor: 'pointer', userSelect: 'none', color: sortField === field ? 'var(--primary)' : undefined, background: sortField === field ? '#EFF6FF' : undefined },
    onClick: () => handleSort(field),
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1>Customers</h1>
      <div className="card" style={{ overflow: 'hidden' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite', flexShrink: 0 }} />
            <div style={{ flex: 1, height: 13, borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          </div>
        ))}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>
            <a href="/admin/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</a>
            <span style={{ margin: '0 5px' }}>›</span>
            <span style={{ color: 'var(--text-secondary)' }}>Customers</span>
          </div>
          <h1>Customers</h1>
        </div>
        {isFetching && !isLoading && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', opacity: 0.6, animation: 'pulse 1s ease-in-out infinite', marginBottom: 8 }} />}
      </div>

      {/* Error */}
      {isError && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: 13.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error?.message ?? 'Failed to load customers.'}</span>
          <button onClick={() => refetch()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C', fontWeight: 600, fontFamily: 'inherit' }}>Retry</button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="filter-toolbar">
        {/* Search full-width */}
        <div className="filter-search-row">
          <Search size={16} className="filter-search-icon" />
          <input
            className="filter-search-input"
            placeholder="Search by name, email or CRM…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Dropdowns */}
        <div className="filter-dropdowns-row">
          <div className="filter-select-wrap">
            <select className={`filter-select${sourceFilter ? ' active' : ''}`} value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }} disabled={isSourceLoading}>
              <option value="">{isSourceLoading ? 'Loading…' : 'Source CRM: All'}</option>
              {sourceSystems.map(s => {
                const label = s.system_name.toLowerCase() === 'espocrm' ? 'EspoCRM' : s.system_name.charAt(0).toUpperCase() + s.system_name.slice(1);
                return <option key={s.id} value={s.system_name}>{label}</option>;
              })}
            </select>
            <ChevronDown size={13} className="filter-chevron" />
          </div>

          {hasActiveFilters && <button className="filter-clear-btn" onClick={clearFilters}>Clear Filters</button>}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th {...thSort('name')}><span style={{ display: 'flex', alignItems: 'center' }}>CUSTOMER <SortIcon field="name" /></span></th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>CRM</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>{hasActiveFilters ? 'No customers match your filters.' : 'No customers found.'}</td></tr>
              ) : sorted.map((c, i) => (
                <tr key={c.id} className="animate-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: getAvatarColor(c.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>{getInitials(c.name)}</div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#000' }}>{c.name}</div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{c.email || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{c.phone || '—'}</td>
                  <td><span className={crmBadgeClass(c.crm || c.source_system)}>{c.crm || c.source_system}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{pagination.total} customer{pagination.total !== 1 ? 's' : ''} total{hasActiveFilters ? ` — ${sorted.length} shown` : ''}</span>
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
