import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import TicketTable from '../../components/TicketTable';
import Filters from '../../components/Filters';
import { ticketService } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_PAGE_SIZE = 20;

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, total_pages: 1 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filters, setFilters]       = useState({});
  const [search, setSearch]         = useState('');
  const [sort, setSort]             = useState({ field: 'updated', dir: 'desc' });
  const [page, setPage]             = useState(1);

  // FIX: fetchTickets previously captured filters.status and filters.priority
  // from the closure, so those values had to live in useCallback's deps array.
  // Every filter change → new fetchTickets reference → useEffect([fetchTickets])
  // fired → fetch. But React also re-renders the component on filter state
  // change, which caused useCallback to rebuild the function reference a second
  // time in the same cycle, triggering a second effect run and a second fetch.
  //
  // Fix: accept agentId, status, and priority as explicit parameters so the
  // function never reads from the closure. useCallback deps are now empty —
  // the reference is permanently stable and the effect only fires when we
  // explicitly call it with new values.
  const fetchTickets = useCallback(async (
    currentPage = 1,
    agentId     = null,
    status      = undefined,
    priority    = undefined,
  ) => {
    if (!agentId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await ticketService.getByAgent(agentId, {
        page:            currentPage,
        page_size:       DEFAULT_PAGE_SIZE,
        status:          status   || undefined,
        priority:        priority || undefined,
        include_deleted: false,
      });
      setTickets(data.items ?? []);
      setPagination({
        total:       data.total       ?? 0,
        page:        data.page        ?? currentPage,
        total_pages: data.total_pages ?? 1,
      });
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError('Failed to load your tickets. Please try again.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []); // stable reference — no closure deps

  // Single effect: fires on mount and whenever agent or filters change.
  // All values are passed explicitly so fetchTickets stays stable and the
  // effect is the sole driver of fetches.
  useEffect(() => {
    setPage(1);
    fetchTickets(1, user?.agent_id, filters.status, filters.priority);
  }, [user?.agent_id, filters.status, filters.priority]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSort = (field) => {
    setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchTickets(newPage, user?.agent_id, filters.status, filters.priority);
  };

  // Client-side search on top of the current fetched page.
  // Status/priority are already filtered server-side in fetchTickets.
  const filtered = tickets.filter(ticket => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      ticket.title?.toLowerCase().includes(q) ||
      ticket.crm_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Breadcrumb */}
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          Dashboard › <span style={{ color: 'var(--text-primary)' }}>My Tickets</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>My Tickets</h2>
      </div>

      {/* Search + Filters */}
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
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
        <Filters filters={filters} onChange={setFilters} />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: '#FEF2F2', border: '1px solid #FCA5A5',
          color: '#DC2626', fontSize: 13.5,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{error}</span>
          <button
            onClick={() => fetchTickets(page, user?.agent_id, filters.status, filters.priority)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 600, fontFamily: 'inherit' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* No agent_id guard */}
      {!user?.agent_id && !loading && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13.5 }}>
          No agent profile linked to your account.
        </div>
      )}

      {/* Table — passes isAgent so TicketTable routes expansion to /agent/tickets/:id.
          search and filters are handled above (client-side search, server-side
          status/priority), so we pass empty values here to avoid double-filtering. */}
      <TicketTable
        tickets={filtered}
        loading={loading}
        isAgent
        onSort={handleSort}
        sortField={sort.field}
        sortDir={sort.dir}
        filters={{}}
        search=""
      />

      {/* Pagination */}
      {!loading && !error && pagination.total_pages > 1 && (
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
              disabled={page <= 1}
              style={{ padding: '4px 10px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
            >
              ‹ Prev
            </button>
            <span>Page {pagination.page} of {pagination.total_pages}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= pagination.total_pages}
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