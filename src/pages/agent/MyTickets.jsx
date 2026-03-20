import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import TicketTable from '../../components/TicketTable';
import Filters from '../../components/Filters';
import { ticketService } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filters, setFilters] = useState({});
  const [search, setSearch]   = useState('');
  const [sort, setSort]       = useState({ field: 'updated', dir: 'desc' });

  useEffect(() => {
    setLoading(true);
    setError(null);
    ticketService.getAll({ assignee: user?.name })
      .then(r => setTickets(r.data?.items || []))
      .catch(err => {
        console.error('Failed to load tickets:', err);
        setError('Failed to load your tickets. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [user?.name]);

  const handleSort = (field) => {
    setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          Dashboard › <span style={{ color: 'var(--text-primary)' }}>My Tickets</span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>My Tickets</h2>
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: '#FEF2F2', border: '1px solid #FCA5A5',
          color: '#DC2626', fontSize: 13.5,
        }}>
          {error}
        </div>
      )}

      <TicketTable
        tickets={tickets}
        loading={loading}
        isAgent
        onSort={handleSort}
        sortField={sort.field}
        sortDir={sort.dir}
        filters={filters}
        search={search}
      />
    </div>
  );
}
