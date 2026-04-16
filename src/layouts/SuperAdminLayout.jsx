import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';

export default function SuperAdminLayout() {
  const [collapsed,    setCollapsed]    = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [isMobile,     setIsMobile]     = useState(window.innerWidth <= 820);

  const sidebarWidth = collapsed
    ? 'var(--sidebar-collapsed)'
    : 'var(--sidebar-width)';

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 820;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Shared Sidebar — role="superadmin" */}
      <Sidebar
        role="superadmin"
        onCollapsedChange={setCollapsed}
      />

      {/* Main content column */}
      <div style={{
        flex:       1,
        display:    'flex',
        flexDirection: 'column',
        marginLeft: isMobile ? 0 : sidebarWidth,
        transition: 'margin-left var(--transition-slow)',
        minWidth:   0,
      }}>
        {/* Shared Navbar — passes mobile props for hamburger */}
        <Navbar
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />

        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}