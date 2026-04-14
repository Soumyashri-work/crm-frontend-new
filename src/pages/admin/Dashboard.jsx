import { useQuery } from '@tanstack/react-query';
import DashboardWidgets from '../../components/DashboardWidgets';
import Charts from '../../components/Charts';
import TicketTable from '../../components/TicketTable';
import { ticketService, ticketKeys } from '../../services/ticketService';

const RECENT_PARAMS = { page: 1, page_size: 5 };

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ticketKeys.stats(),
    queryFn:  ticketService.getStats,
    staleTime: 60_000,
  });

  const { data: recentData, isLoading: ticketsLoading } = useQuery({
    queryKey: ticketKeys.list(RECENT_PARAMS),
    queryFn:  () => ticketService.getAll(RECENT_PARAMS),
    staleTime: 30_000,
  });

  const recentTickets = recentData?.items ?? [];

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
          Welcome back! Here's what's happening today.
        </p>
      </div>

      <DashboardWidgets stats={stats} />
      <Charts statusData={statusData} priorityData={priorityData} />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3>Recent Tickets</h3>
          <a href="/admin/tickets" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>View all →</a>
        </div>
        <TicketTable tickets={recentTickets} loading={ticketsLoading} />
      </div>
    </>
  );
}
