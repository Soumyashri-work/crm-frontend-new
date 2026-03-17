import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import TicketTable from '../../components/TicketTable';
import Filters from '../../components/Filters';
import { ticketService } from '../../services/ticketService';

export default function AdminTickets() {
  const [tickets, setTickets] = useState(null);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ field: 'updated', dir: 'desc' });

  useEffect(() => {
    ticketService.getAll({})
      .then(r => setTickets(r.data?.items || r.data || []))
      .catch(() => setTickets(null)); // null = use SAMPLE data in TicketTable
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

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ width: '100%', paddingLeft: 36 }}
            placeholder="Search by ticket title or CRM ticket ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Filters filters={filters} onChange={setFilters} />
      </div>

      <TicketTable
        tickets={tickets}
        onSort={handleSort}
        sortField={sort.field}
        sortDir={sort.dir}
        filters={filters}
        search={search}
      />
    </div>
  );
}
