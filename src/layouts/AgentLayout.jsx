import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';

export default function AgentLayout() {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed
    ? 'var(--sidebar-collapsed)'
    : 'var(--sidebar-width)';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar role="agent" onCollapsedChange={setCollapsed} />

      <div style={{
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        marginLeft:    sidebarWidth,
        transition:    'margin-left var(--transition-slow)',
      }}>
        <Navbar />
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}