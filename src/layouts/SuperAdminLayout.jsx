import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Building2, Shield, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const superAdminNav = [
  { to: '/superadmin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/superadmin/tenants',   icon: Building2,       label: 'Tenants'   },
  { to: '/superadmin/admins',    icon: Shield,          label: 'Admins'    },
  { to: '/superadmin/settings',  icon: Settings,        label: 'Settings'  },
];

function SuperAdminSidebar({ collapsed, setCollapsed }) {
  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: collapsed ? 72 : 220,
      height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      zIndex: 1000,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed ? '18px 0' : '18px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid var(--border)',
        minHeight: 64,
        flexShrink: 0,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Shield size={18} color="white" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Super Admin</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Multi-Tenant Portal</div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto', minHeight: 0 }}>
        {superAdminNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: 10, padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 'var(--radius-sm)',
              fontWeight: isActive ? 600 : 400,
              fontSize: 14,
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

      <div style={{ borderTop: '1px solid var(--border)', padding: 10, flexShrink: 0 }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            width: '100%', padding: '9px', borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
            fontFamily: 'inherit', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          {collapsed ? <ChevronRight size={17} /> : <><ChevronLeft size={17} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

function SuperAdminNavbar() {
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
    try { await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`); } catch (_) {}
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SA';

  return (
    <header style={{
      height: 64,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', flex: 1 }}>
        Super Admin Portal
      </div>

      <div style={{ position: 'relative' }} ref={dropRef}>
        <button
          onClick={() => setDropOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 8px', borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: user?.picture ? 'transparent' : 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
          }}>
            {user?.picture
              ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{initials}</span>
            }
          </div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.2 }}>
              {user?.name || 'Super Admin'}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--primary)',
              background: 'var(--primary-light)', padding: '1px 7px',
              borderRadius: 99, display: 'inline-block', marginTop: 2,
            }}>
              SUPER ADMIN
            </div>
          </div>
        </button>

        {dropOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
            minWidth: 200, zIndex: 200, overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{user?.name || 'Super Admin'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email || ''}</div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '11px 16px',
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', fontSize: 13.5,
                color: 'var(--danger)', fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default function SuperAdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 220;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <SuperAdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        marginLeft: sidebarWidth,
        transition: 'margin-left 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <SuperAdminNavbar />
        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}