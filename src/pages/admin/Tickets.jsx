import { useState } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import TicketTable from '../../components/TicketTable';
import Filters from '../../components/Filters';
import { ticketService, ticketKeys } from '../../services/ticketService';

const DEFAULT_PAGE_SIZE = 20;

export default function AdminTickets() {
  const [filters,        setFilters]        = useState({});
  const [search,         setSearch]         = useState('');
  const [sort,           setSort]           = useState({ field: 'updated_at', dir: 'desc' });
  const [page,           setPage]           = useState(1);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const queryParams = {
    page,
    page_size:       DEFAULT_PAGE_SIZE,
    include_deleted: includeDeleted,
  };

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ticketKeys.list(queryParams),
    queryFn:  () => ticketService.getAll(queryParams),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const tickets    = data?.items        ?? [];
  const pagination = {
    total:       data?.total       ?? 0,
    page:        data?.page        ?? page,
    total_pages: data?.total_pages ?? 1,
  };

  const handleSort = (field) =>
    setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));

  const handlePageChange = (newPage) => setPage(newPage);

  const filtered = tickets
    .filter(ticket => {
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        ticket.title?.toLowerCase().includes(q) ||
        ticket.crm_id?.toLowerCase().includes(q)
      );
    })
    .filter(ticket => {
      if (filters.status        && ticket.status        !== filters.status)        return false;
      if (filters.priority      && ticket.priority      !== filters.priority)      return false;
      if (filters.source_system && ticket.source_system !== filters.source_system) return false;
      return true;
    })
    .sort((a, b) => {
      const val = (t) => t[sort.field] ?? '';
      return sort.dir === 'asc'
        ? String(val(a)).localeCompare(String(val(b)))
        : String(val(b)).localeCompare(String(val(a)));
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>
            <a href="/admin/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</a>
            <span style={{ margin: '0 6px' }}>›</span>
            <span style={{ color: 'var(--text-secondary)' }}>Tickets</span>
          </div>
          <h1>Tickets</h1>
        </div>
        {isFetching && !isLoading && (
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--primary)', opacity: 0.6,
            animation: 'pulse 1s ease-in-out infinite', marginBottom: 8,
          }} />
        )}
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div className="filter-toolbar">
          {/* Full-width search */}
          <div className="filter-search-row">
            <Search size={16} className="filter-search-icon" />
            <input
              className="filter-search-input"
              placeholder="Search by title or CRM ticket ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Dropdowns row */}
          <Filters filters={filters} onChange={setFilters} />
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: '#FEF2F2', border: '1px solid #FCA5A5',
          color: '#B91C1C', fontSize: 13.5,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{error?.message ?? 'Failed to load tickets.'}</span>
          <button
            onClick={() => refetch()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', padding: '0 4px' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Ticket table */}
      <TicketTable
        tickets={filtered}
        loading={isLoading}
        onSort={handleSort}
        sortField={sort.field}
        sortDir={sort.dir}
        filters={filters}
        search={search}
      />

      {/* Pagination */}
      {!isLoading && !isError && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontSize: 13, color: 'var(--text-muted)',
        }}>
          <span>
            {pagination.total} ticket{pagination.total !== 1 ? 's' : ''} total
            {search || Object.keys(filters).length > 0
              ? ` — showing ${filtered.length} after filters`
              : ''}
          </span>

          {pagination.total_pages > 1 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || isFetching}
                style={{ padding: '4px 10px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
              >
                ‹ Prev
              </button>
              <span>Page {pagination.page} of {pagination.total_pages}</span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pagination.total_pages || isFetching}
                style={{ padding: '4px 10px', cursor: page >= pagination.total_pages ? 'not-allowed' : 'pointer' }}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
