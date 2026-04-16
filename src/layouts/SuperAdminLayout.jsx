import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Building2, Shield, Settings, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const superAdminNav = [
  { to: '/superadmin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/superadmin/tenants',   icon: Building2,       label: 'Tenants'   },
  { to: '/superadmin/admins',    icon: Shield,          label: 'Admins'    },
  { to: '/superadmin/settings',  icon: Settings,        label: 'Settings'  },
];

function SuperAdminSidebar({ collapsed, setCollapsed, isMobile, sidebarOpen, setSidebarOpen }) {
  const handleNavClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const sidebarLeft = isMobile ? (sidebarOpen ? '0' : '-100%') : '0';

  return (
    <aside style={{
      position: 'fixed',
      left: sidebarLeft,
      top: 0,
      width: collapsed ? 'var(--sidebar-collapsed, 70px)' : 'var(--sidebar-width, 260px)',
      height: '100vh',
      background: 'var(--surface)',
      borderRight: '1.5px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all var(--transition-slow)',
      overflow: 'hidden',
      zIndex: 1000,
    }}>
      {/* Brand Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: collapsed ? '0' : '0 20px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '1.5px solid var(--border)',
        height: 'var(--navbar-height, 60px)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          background: 'var(--primary)',
          borderRadius: '8px'
        }}>
          <Shield size={18} color="white" />
        </div>
        {!collapsed && (
          <div style={{ lineHeight: 1.2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Super Admin</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Multi-Tenant Portal</span>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', minHeight: 0 }}>
        {superAdminNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={handleNavClick}
            title={collapsed ? label : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 'var(--radius-sm, 6px)',
              fontWeight: isActive ? 700 : 500,
              fontSize: 13.5,
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              transition: 'all 0.2s',
              textDecoration: 'none',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle (Desktop only) */}
      {!isMobile && (
        <div style={{ padding: '12px', flexShrink: 0, borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              width: '100%',
              height: '36px',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'var(--surface-2, #f9fafb)',
              border: '1.5px solid var(--border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition)',
            }}
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
        </div>
      )}
    </aside>
  );
}

function SuperAdminNavbar({ isMobile, sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    if (dropOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`);
    } catch (_) {}
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      height: 'var(--navbar-height, 60px)',
      background: 'var(--surface)',
      borderBottom: '1.5px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: isMobile ? '0 16px 0 50px' : '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexShrink: 0,
    }}>
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'absolute',
            left: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      <div style={{ fontWeight: 600, fontSize: isMobile ? 14 : 18, color: 'var(--text-primary)', flex: 1 }}>
        Unified CRM Ticket Dashboard
      </div>

      <div style={{ position: 'relative' }} ref={dropRef}>
        <button
          onClick={() => setDropOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13
          }}>
            {user?.name?.[0]?.toUpperCase() || 'S'}
          </div>
          {!isMobile && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.2, color: 'var(--text-primary)' }}>
                {user?.name || 'Super Admin'}
              </div>
              <div style={{
                fontSize: 10, fontWeight: 800, color: 'var(--primary)',
                background: 'var(--primary-light)', padding: '1px 7px',
                borderRadius: 99, display: 'inline-block', marginTop: 2,
                textTransform: 'uppercase'
              }}>
                SUPER ADMIN
              </div>
            </div>
          )}
        </button>

        {dropOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            background: 'var(--surface)', border: '1.5px solid var(--border-dark)',
            borderRadius: 'var(--radius-sm, 6px)', boxShadow: 'var(--shadow-lg)',
            width: 210, zIndex: 200, overflow: 'hidden'
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', background: 'white' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#000', lineHeight: 1.2 }}>
                {user?.name || 'User Name'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                {user?.email || 'admin@example.com'}
              </div>
            </div>
            <div style={{ padding: '4px' }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '10px 12px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left', color: 'var(--danger, #ef4444)',
                  fontSize: 13, fontWeight: 500, borderRadius: '4px', transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default function SuperAdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 820);

  const sidebarWidth = collapsed ? 'var(--sidebar-collapsed, 70px)' : 'var(--sidebar-width, 260px)';

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 820;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg, #f3f4f6)' }}>
      {isMobile && sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <SuperAdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: isMobile ? 0 : sidebarWidth,
        transition: 'margin-left var(--transition-slow)',
        minWidth: 0,
      }}>
        <SuperAdminNavbar isMobile={isMobile} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}