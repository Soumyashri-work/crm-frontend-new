/**
 * pages/agent/MyTickets.jsx
 *
 * Agent ticket list. React Query handles fetching, caching, and deduplication.
 * Server-side filtering on status/priority; client-side search on the fetched page.
 */

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

  // Server-side filter params included in the cache key —
  // a new key = new fetch, same key = cache hit.
  const queryParams = {
    page,
    page_size:       DEFAULT_PAGE_SIZE,
    status:          filters.status   || undefined,
    priority:        filters.priority || undefined,
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
    enabled:  !!agentId, // don't fire until we have an agentId
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const tickets    = data?.items        ?? [];
  const pagination = {
    total:       data?.total       ?? 0,
    page:        data?.page        ?? page,
    total_pages: data?.total_pages ?? 1,
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSort = (field) =>
    setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));

  const handlePageChange = (newPage) => setPage(newPage);

  // Reset to page 1 when server-side filters change
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Client-side search only (status/priority are server-side)
  const filtered = tickets.filter(ticket => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      ticket.title?.toLowerCase().includes(q) ||
      ticket.crm_id?.toLowerCase().includes(q)
    );
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Breadcrumb + heading */}
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          Dashboard › <span style={{ color: 'var(--text-primary)' }}>My Tickets</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>My Tickets</h2>
      </div>

      {/* Search + Filters */}
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)',
              pointerEvents: 'none',
            }} />
            <input
              className="form-input"
              style={{ width: '100%', paddingLeft: 36 }}
              placeholder="Search tickets…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
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

        {/* Filters drive server-side params via handleFiltersChange */}
        <Filters filters={filters} onChange={handleFiltersChange} />
      </div>

      {/* Error */}
      {isError && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: '#FEF2F2', border: '1px solid #FCA5A5',
          color: '#DC2626', fontSize: 13.5,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{error?.message ?? 'Failed to load your tickets.'}</span>
          <button
            onClick={() => refetch()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 600, fontFamily: 'inherit' }}
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

      {/* Table – status/priority already filtered server-side, pass empty to avoid double-filter */}
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
      {!isLoading && !isError && pagination.total_pages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontSize: 13, color: 'var(--text-muted)',
        }}>
          <span>
            {pagination.total} ticket{pagination.total !== 1 ? 's' : ''} total
            {search ? ` — ${filtered.length} shown` : ''}
          </span>
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
        </div>
      )}
    </div>
  );
}