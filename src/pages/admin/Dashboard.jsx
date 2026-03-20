import { useState, useEffect } from 'react';
import DashboardWidgets from '../../components/DashboardWidgets';
import Charts from '../../components/Charts';
import TicketTable from '../../components/TicketTable';
import { ticketService } from '../../services/ticketService';

export default function AdminDashboard() {
  const [stats, setStats]               = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    // Stats (best-effort — widget falls back to placeholders if it fails)
    ticketService.getStats()
      .then(r => setStats(r.data))
      .catch(() => {});

    // Recent tickets — last 5 by updated timestamp
    ticketService.getAll({ limit: 5, sort: '-updated' })
      .then(r => setRecentTickets(r.data?.items || []))
      .catch(() => setRecentTickets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>
          Welcome back! Here's what's happening today.
        </p>
      </div>

      <DashboardWidgets stats={stats} />
      <Charts />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Recent Tickets</h3>
          <a href="/admin/tickets" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>
            View all →
          </a>
        </div>
        <TicketTable tickets={recentTickets} loading={loading} />
      </div>
    </div>
  );
}
