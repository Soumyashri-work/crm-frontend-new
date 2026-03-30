import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Ticket, Users, UserCircle,
  Settings, ChevronLeft, ChevronRight, ClipboardList
} from 'lucide-react';

const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/tickets',   icon: Ticket,          label: 'Tickets'   },
  // Accounts removed — admin is scoped to their own tenant
  { to: '/admin/customers', icon: UserCircle,      label: 'Customers' },
  { to: '/admin/agents',    icon: Users,           label: 'Agents'    },
  { to: '/admin/settings',  icon: Settings,        label: 'Settings'  },
];

const agentNav = [
  { to: '/agent/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/agent/my-tickets', icon: ClipboardList,   label: 'My Tickets' },
  { to: '/agent/profile',    icon: UserCircle,      label: 'Profile'    },
];

export default function Sidebar({ isAdmin }) {
  const [collapsed, setCollapsed] = useState(false);
  const { logout }                = useAuth();
  const navigate                  = useNavigate();
  const nav                       = isAdmin ? adminNav : agentNav;

  const handleLogout = async () => {
    try { await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`); } catch (_) {}
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
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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

      {/* Collapse toggle */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px' }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{
            width: '100%', padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
            transition: 'all var(--transition)',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--primary-light)';
            e.currentTarget.style.color = 'var(--primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--surface-2)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}