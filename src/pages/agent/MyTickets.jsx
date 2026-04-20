import { useState } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import TicketTable from '../../components/TicketTable';
import Filters from '../../components/Filters';
import { ticketService, ticketKeys } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_PAGE_SIZE = 20;

export default function MyTickets() {
  const { user } = useAuth();

  const [filters, setFilters] = useState({});
  const [search,  setSearch]  = useState('');
  const [sort,    setSort]    = useState({ field: 'updated', dir: 'desc' });
  const [page,    setPage]    = useState(1);

  const agentId = user?.agent_id;

  const queryParams = {
    page,
    page_size:       DEFAULT_PAGE_SIZE,
    status:          filters.status        || undefined,
    priority:        filters.priority      || undefined,
    source_system:   filters.source_system || undefined,
    include_deleted: false,
  };

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ticketKeys.byAgent(agentId, queryParams),
    queryFn:  () => ticketService.getByAgent(agentId, queryParams),
    enabled:  !!agentId,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const tickets    = data?.items ?? [];
  const pagination = { total: data?.total ?? 0, page: data?.page ?? page, total_pages: data?.total_pages ?? 1 };

  const handleFiltersChange = (f) => { setFilters(f); setPage(1); };

  const filtered = tickets.filter(t => {
    if (filters.source_system) {
      const c = t.crm || t.source_system || '';
      if (c.toLowerCase() !== filters.source_system.toLowerCase()) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return t.title?.toLowerCase().includes(q) || t.crm_id?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex-col-gap">

      {/* Header */}
      <div>
        <div className="text-xs text-muted" style={{ marginBottom: 'var(--space-sm)', fontWeight: 500 }}>
          Dashboard <span style={{ margin: '0 var(--space-sm)' }}>›</span>
          <span style={{ color: 'var(--text-secondary)' }}>My Tickets</span>
        </div>
        <h1>My Tickets</h1>
      </div>

      {/* Filter toolbar */}
      <div className="filter-toolbar">
        <div className="filter-search-row">
          <Search size={16} className="filter-search-icon" />
          <input
            className="filter-search-input"
            placeholder="Search tickets by title or CRM ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {isFetching && !isLoading && (
            <div className="loading-pulse" />
          )}
        </div>
        <Filters filters={filters} onChange={handleFiltersChange} />
      </div>

      {/* Error */}
      {isError && (
        <div className="alert-error">
          <span>{error?.message ?? 'Failed to load your tickets.'}</span>
          <button 
            onClick={() => refetch()} 
            className="alert-retry-btn"
          >
            Retry
          </button>
        </div>
      )}

      {!agentId && !isLoading && (
        <div className="empty-state-message">
          No agent profile linked to your account.
        </div>
      )}

      <TicketTable tickets={filtered} loading={isLoading} isAgent onSort={f => setSort(s => ({ field: f, dir: s.field === f && s.dir === 'asc' ? 'desc' : 'asc' }))} sortField={sort.field} sortDir={sort.dir} filters={{}} search="" />

      {/* Pagination */}
      {!isLoading && !isError && (
        <div className="pagination-footer">
          <span>{pagination.total} ticket{pagination.total !== 1 ? 's' : ''} total{search ? ` — ${filtered.length} shown` : ''}</span>
          {pagination.total_pages > 1 && (
            <div className="pagination-controls">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1 || isFetching} className="pagination-btn">‹ Prev</button>
              <span>Page {pagination.page} of {pagination.total_pages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.total_pages || isFetching} className="pagination-btn">Next ›</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}