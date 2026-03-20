import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import TicketTable from '../../components/TicketTable';
import Filters from '../../components/Filters';
import { ticketService } from '../../services/ticketService';

export default function AdminTickets() {
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filters, setFilters]   = useState({});
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState({ field: 'updated', dir: 'desc' });

  useEffect(() => {
    setLoading(true);
    setError(null);
    ticketService.getAll({})
      .then(r => setTickets(r.data?.items || []))
      .catch(err => {
        console.error('Failed to load tickets:', err);
        setError('Failed to load tickets. Please check your connection and try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field) => {
    setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        <a href="/admin/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</a>
        <span style={{ margin: '0 6px' }}>›</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Tickets</span>
      </div>

      {/* Search + filters */}
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-muted)',
          }} />
          <input
            className="form-input"
            style={{ width: '100%', paddingLeft: 36 }}
            placeholder="Search by ticket title or CRM ticket ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Filters filters={filters} onChange={setFilters} />
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: '#FEF2F2', border: '1px solid #FCA5A5',
          color: '#DC2626', fontSize: 13.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {error}
          <button
            onClick={() => { setError(null); setLoading(true); ticketService.getAll({}).then(r => setTickets(r.data?.items || [])).catch(() => setError('Still failing. Please try again.')).finally(() => setLoading(false)); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}
          >
            Retry
          </button>
        </div>
      )}

      <TicketTable
        tickets={tickets}
        loading={loading}
        onSort={handleSort}
        sortField={sort.field}
        sortDir={sort.dir}
        filters={filters}
        search={search}
      />

      {/* Row count */}
      {!loading && !error && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'right' }}>
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} loaded
        </div>
      )}
    </div>
  );
}
