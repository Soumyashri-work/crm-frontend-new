import { useState, useEffect } from 'react';
import { ticketService } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import DashboardWidgets from '../../components/DashboardWidgets';
import TicketTable from '../../components/TicketTable';

export default function AgentDashboard() {
  const { user } = useAuth();
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [sort, setSort]           = useState({ field: 'updated', dir: 'desc' });

  useEffect(() => {
    ticketService.getAll({ assignee: user?.name, limit: 5 })
      .then(r => setMyTickets(r.data?.items || []))
      .catch(() => setMyTickets([]))
      .finally(() => setLoading(false));
  }, [user?.name]);

  const handleSort = (field) => {
    setSort(s => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>My Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>
          Hi {user?.name?.split(' ')[0] || 'there'}! Here are your assigned tickets.
        </p>
      </div>

      <DashboardWidgets />

      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>My Recent Tickets</h3>
        <TicketTable
          tickets={myTickets}
          loading={loading}
          isAgent
          onSort={handleSort}
          sortField={sort.field}
          sortDir={sort.dir}
        />
      </div>
    </div>
  );
}
