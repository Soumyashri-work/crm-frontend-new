/**
 * pages/admin/AdminTickets.jsx
 *
 * Admin ticket list page.
 *
 * - Fetches from GET /api/v1/tickets/ with pagination
 * - Supports search, filters, sort — all client-side for now
 * - Shows full detail on row click via GET /api/v1/tickets/{id}
 * - Admins see all tickets including soft-deleted (toggle)
 */

import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import TicketTable from '../../components/TicketTable';
import Filters from '../../components/Filters';
import { ticketService } from '../../services/ticketService';

const DEFAULT_PAGE_SIZE = 20;

export default function AdminTickets() {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [tickets, setTickets]           = useState([]);
  const [pagination, setPagination]     = useState({ total: 0, page: 1, total_pages: 1 });
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [filters, setFilters]           = useState({});
  const [search, setSearch]             = useState('');
  const [sort, setSort]                 = useState({ field: 'updated_at', dir: 'desc' });
  const [page, setPage]                 = useState(1);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch
  // -------------------------------------------------------------------------
  const fetchTickets = useCallback(async (currentPage = 1, showDeleted = includeDeleted) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ticketService.getAll({
        page:            currentPage,
        page_size:       DEFAULT_PAGE_SIZE,
        include_deleted: showDeleted,
      });

      // Backend returns: { items, total, page, page_size, total_pages }
      setTickets(data.items ?? []);
      setPagination({
        total:       data.total       ?? 0,
        page:        data.page        ?? currentPage,
        total_pages: data.total_pages ?? 1,
      });
    } catch (err) {
      console.error('AdminTickets: failed to load tickets', err);
      setError(err.message || 'Failed to load tickets. Please try again.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [includeDeleted]);

  // Initial load
  useEffect(() => {
    fetchTickets(1);
  }, [fetchTickets]);

  // Refetch when include_deleted toggle changes
  useEffect(() => {
    setPage(1);
    fetchTickets(1, includeDeleted);
  }, [includeDeleted]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleSort = (field) => {
    setSort(s => ({
      field,
      dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchTickets(newPage);
  };

  const handleRetry = () => {
    fetchTickets(page);
  };

  // -------------------------------------------------------------------------
  // Client-side derived data
  // Apply search + filters + sort on top of fetched page
  // -------------------------------------------------------------------------
  const filtered = tickets
    .filter(ticket => {
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        ticket.title?.toLowerCase().includes(q) ||
        ticket.crm_ticket_id?.toLowerCase().includes(q)
      );
    })
    .filter(ticket => {
      if (filters.status   && ticket.status   !== filters.status)   return false;
      if (filters.priority && ticket.priority !== filters.priority)  return false;
      if (filters.source_system && ticket.source_system !== filters.source_system) return false;
      return true;
    })
    .sort((a, b) => {
      const val = (t) => t[sort.field] ?? '';
      return sort.dir === 'asc'
        ? String(val(a)).localeCompare(String(val(b)))
        : String(val(b)).localeCompare(String(val(a)));
    });

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        <a href="/admin/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</a>
        <span style={{ margin: '0 6px' }}>›</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Tickets</span>
      </div>

      {/* Search + Filters */}
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Search input */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-muted)',
              pointerEvents: 'none',
            }} />
            <input
              className="form-input"
              style={{ width: '100%', paddingLeft: 36 }}
              placeholder="Search by title or CRM ticket ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Admin-only: show deleted toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={e => setIncludeDeleted(e.target.checked)}
            />
            Show deleted
          </label>
        </div>

        <Filters filters={filters} onChange={setFilters} />
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          color: '#DC2626',
          fontSize: 13.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{error}</span>
          <button
            onClick={handleRetry}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#DC2626', fontWeight: 600, fontSize: 13,
              fontFamily: 'inherit', padding: '0 4px',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Ticket table */}
      <TicketTable
        tickets={filtered}
        loading={loading}
        onSort={handleSort}
        sortField={sort.field}
        sortDir={sort.dir}
        filters={filters}
        search={search}
      />

      {/* Pagination + row count */}
      {!loading && !error && (
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
          )}
        </div>
      )}
    </div>
  );
}