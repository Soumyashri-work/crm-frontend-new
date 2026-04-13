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
    status:          filters.status   || undefined,
    priority:        filters.priority || undefined,
    source_system:   filters.source_system || undefined,
    include_deleted: false,
  };

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ticketKeys.byAgent(agentId, queryParams),
    queryFn:  () => ticketService.getByAgent(agentId, queryParams),
    enabled:  !!agentId,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const tickets    = data?.items       ?? [];
  const pagination = {
    total:       data?.total       ?? 0,
    page:        data?.page        ?? page,
    total_pages: data?.total_pages ?? 1,
  };

  const handleSort = (field) =>
    setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));

  const handlePageChange = (newPage) => setPage(newPage);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const filtered = tickets.filter(ticket => {
    if (filters.source_system) {
      const ticketCrm = ticket.crm || ticket.source_system || '';
      if (ticketCrm.toLowerCase() !== filters.source_system.toLowerCase()) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        ticket.title?.toLowerCase().includes(q) ||
        ticket.crm_id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>
          Dashboard <span style={{ margin: '0 4px' }}>›</span>
          <span style={{ color: 'var(--text-secondary)' }}>My Tickets</span>
        </div>
        <h1>My Tickets</h1>
      </div>

      {/* Search + Filters */}
      <div className="filter-toolbar">
        {/* Full-width search */}
        <div className="filter-search-row">
          <Search size={16} className="filter-search-icon" />
          <input
            className="filter-search-input"
            placeholder="Search tickets by title or CRM ID…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {isFetching && !isLoading && (
            <div style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--primary)', opacity: 0.6,
              animation: 'pulse 1s ease-in-out infinite',
            }} />
          )}
        </div>

        {/* Dropdowns */}
        <Filters filters={filters} onChange={handleFiltersChange} />
      </div>

      {/* Error */}
      {isError && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: '#FEF2F2', border: '1px solid #FCA5A5',
          color: '#B91C1C', fontSize: 13.5,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{error?.message ?? 'Failed to load your tickets.'}</span>
          <button
            onClick={() => refetch()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C', fontWeight: 600, fontFamily: 'inherit' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* No agent guard */}
      {!agentId && !isLoading && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13.5 }}>
          No agent profile linked to your account.
        </div>
      )}

      <TicketTable
        tickets={filtered}
        loading={isLoading}
        isAgent
        onSort={handleSort}
        sortField={sort.field}
        sortDir={sort.dir}
        filters={{}}
        search=""
      />

      {/* Pagination */}
      {!isLoading && !isError && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontSize: 13, color: 'var(--text-muted)',
        }}>
          <span>
            {pagination.total} ticket{pagination.total !== 1 ? 's' : ''} total
            {search ? ` — ${filtered.length} shown after search` : ''}
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
