import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Ticket, Building2, Users, UserCircle,
  Settings, ChevronLeft, ChevronRight, LogOut, ClipboardList
} from 'lucide-react';

const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/tickets',   icon: Ticket,          label: 'Tickets'   },
  { to: '/admin/accounts',  icon: Building2,        label: 'Accounts'  },
  { to: '/admin/customers', icon: UserCircle,       label: 'Customers' },
  { to: '/admin/users',     icon: Users,            label: 'Users'     },
  { to: '/admin/settings',  icon: Settings,         label: 'Settings'  },
];

const agentNav = [
  { to: '/agent/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agent/my-tickets',icon: ClipboardList,   label: 'My Tickets'},
  { to: '/agent/profile',   icon: UserCircle,      label: 'Profile'   },
];

export default function Sidebar({ isAdmin }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = isAdmin ? adminNav : agentNav;

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`);
    } catch (_) {}
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width var(--transition-slow)',
      position: 'relative',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Brand */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed ? '18px 0' : '18px 20px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid var(--border)',
        minHeight: 'var(--navbar-height)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--primary)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Ticket size={18} color="white" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Unified CRM</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>Ticket System</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(({ to, icon: Icon, label }) => (
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
              transition: 'all var(--transition)',
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

      {/* User + Logout */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 10px' }}>
        {!collapsed && user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', marginBottom: 8,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-2)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {(user.name || user.email || 'U').slice(0,2).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: 10, padding: collapsed ? '10px 0' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 'var(--radius-sm)', border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: 14, fontFamily: 'inherit',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          position: 'absolute', bottom: 80, right: -12,
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--surface)', border: '1px solid var(--border)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow)', zIndex: 10,
        }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
