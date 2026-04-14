import { useState, useEffect } from 'react';
import { ticketService } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import DashboardWidgets from '../../components/DashboardWidgets';
import Charts from '../../components/Charts';
import TicketTable from '../../components/TicketTable';

export default function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sort, setSort]         = useState({ field: 'updated', dir: 'desc' });

  useEffect(() => {
    if (!user?.agent_id) return;
    ticketService.getAgentStats(user.agent_id).then(d => setStats(d)).catch(() => setStats(null));
    ticketService.getByAgent(user.agent_id, { page: 1, page_size: 5 })
      .then(d => setMyTickets(d.items ?? []))
      .catch(() => setMyTickets([]))
      .finally(() => setLoading(false));
  }, [user?.agent_id]);

  const statusData = stats ? [
    { name: 'Open',    value: stats.by_status?.open    || 0, color: '#2563EB' },
    { name: 'Closed',  value: stats.by_status?.closed  || 0, color: '#10B981' },
    { name: 'Pending', value: stats.by_status?.pending || 0, color: '#F59E0B' },
  ].filter(d => d.value > 0) : null;

  const priorityData = stats ? [
    { name: 'Low',    tickets: stats.by_priority?.low    || 0, color: '#10B981' },
    { name: 'Normal', tickets: stats.by_priority?.normal || 0, color: '#2563EB' },
    { name: 'High',   tickets: stats.by_priority?.high   || 0, color: '#F59E0B' },
    { name: 'Urgent', tickets: stats.by_priority?.urgent || 0, color: '#EF4444' },
  ].filter(d => d.tickets > 0) : null;

  return (
    <>
      <div>
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
          Hi {user?.name?.split(' ')[0] || 'there'}! Here are your assigned tickets.
        </p>
      </div>

      <DashboardWidgets stats={stats} />
      <Charts statusData={statusData} priorityData={priorityData} />

      <div>
        <h3 style={{ marginBottom: 12 }}>My Recent Tickets</h3>
        <TicketTable tickets={myTickets} loading={loading} isAgent
          onSort={f => setSort(s => ({ field: f, dir: s.field === f && s.dir === 'asc' ? 'desc' : 'asc' }))}
          sortField={sort.field} sortDir={sort.dir} />
      </div>
    </>
  );
}
