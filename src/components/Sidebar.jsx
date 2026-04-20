import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Ticket, Users, UserCircle,
  Settings, ChevronLeft, ChevronRight, ClipboardList,
  Building2, Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Nav configs per role ────────────────────────────────────────────────────

const adminNav = [
  { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/tickets',    icon: Ticket,          label: 'Tickets'   },
  { to: '/admin/customers',  icon: Users,           label: 'Customers' },
  { to: '/admin/agents',     icon: UserCircle,      label: 'Agents'    },
  { to: '/admin/settings',   icon: Settings,        label: 'Settings'  },
];

const agentNav = [
  { to: '/agent/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/agent/my-tickets', icon: ClipboardList,   label: 'My Tickets' },
  { to: '/agent/profile',    icon: UserCircle,      label: 'Profile'    },
];

const superAdminNav = [
  { to: '/superadmin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/superadmin/tenants',   icon: Building2,       label: 'Tenants'   },
  { to: '/superadmin/admins',    icon: Shield,          label: 'Admins'    },
  { to: '/superadmin/settings',  icon: Settings,        label: 'Settings'  },
];

// ─── Brand icon / label per role ─────────────────────────────────────────────

const brandConfig = {
  superadmin: {
    icon:     Shield,
    title:    'Super Admin',
    subtitle: 'Multi-Tenant Portal',
  },
  admin: {
    icon:     Ticket,
    title:    'Unified CRM',
    subtitle: 'Ticket Dashboard',
  },
  agent: {
    icon:     Ticket,
    title:    'Unified CRM',
    subtitle: 'Ticket Dashboard',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({ role, isAdmin, onCollapsedChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const { logout }                = useAuth();
  const navigate                  = useNavigate();

  // Resolve role — prefer explicit `role` prop, fall back to `isAdmin` boolean
  const resolvedRole = role ?? (isAdmin ? 'admin' : 'agent');

  const nav    = resolvedRole === 'superadmin' ? superAdminNav
               : resolvedRole === 'admin'      ? adminNav
               :                                 agentNav;

  const brand  = brandConfig[resolvedRole] ?? brandConfig.admin;
  const BrandIcon = brand.icon;

  const handleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  const handleLogout = async () => {
    try { await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`); } catch (_) {}
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      position:        'fixed',
      left:            0,
      top:             0,
      width:           collapsed ? 'var(--sidebar-collapsed, 64px)' : 'var(--sidebar-width, 220px)',
      height:          '100vh',
      background:      'var(--surface)',
      borderRight:     '1px solid var(--border)',
      display:         'flex',
      flexDirection:   'column',
      transition:      'width var(--transition-slow, 0.3s ease)',
      overflow:        'visible', // ✅ MUST be visible so the button can hang over the edge
      zIndex:          'var(--z-sidebar, 999)',
    }}>

      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        gap:            'var(--space-md, 8px)',
        padding:        collapsed ? '18px 0' : '18px 24px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom:   '1px solid var(--border)',
        height:         'var(--navbar-height, 60px)',
        lineHeight:     1,
        flexShrink:     0,
        overflow:       'hidden', // ✅ prevents text spill during transition
      }}>
        <div style={{
          width:           36,
          height:          36,
          borderRadius:    'var(--radius, 10px)',
          background:      'var(--primary)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
        }}>
          <BrandIcon size={18} color="white" />
        </div>

        {!collapsed && (
          <div style={{ lineHeight: 1.2, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2, margin: 0, whiteSpace: 'nowrap' }}>
              {brand.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, lineHeight: 1.2, margin: 0, whiteSpace: 'nowrap' }}>
              {brand.subtitle}
            </div>
          </div>
        )}
      </div>

      {/* ── Nav links ─────────────────────────────────────────────────────── */}
      <nav style={{
        flex:          1,
        padding:       'var(--space-md, 12px) var(--space-sm, 10px)',
        display:       'flex',
        flexDirection: 'column',
        gap:           'var(--space-xs, 2px)',
        overflowX:     'hidden', // ✅ hides text while width transitions
        overflowY:     'auto',
        minHeight:     0,
      }}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            style={({ isActive }) => ({
              display:        'flex',
              alignItems:     'center',
              gap:            'var(--space-md, 10px)',
              padding:        collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius:   'var(--radius-sm)',
              fontWeight:     isActive ? 600 : 400,
              fontSize:       14,
              color:          isActive ? 'var(--primary)' : 'var(--text-secondary)',
              background:     isActive ? 'var(--primary-light)' : 'transparent',
              transition:     'all var(--transition, 0.2s)',
              textDecoration: 'none',
              whiteSpace:     'nowrap', // ✅ stops text wrapping onto multiple lines
              overflow:       'hidden',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Circular Collapse Toggle ──────────────────────────────────────── */}
      <button
        onClick={handleCollapse}
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        style={{
          position: 'absolute',
          right: -14,
          top: 'calc(var(--navbar-height, 60px) + 24px)',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'var(--surface)',
          border: '2px solid var(--border)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 'var(--z-fixed, 200)',
          color: 'var(--text-secondary)',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all var(--transition)',
          padding: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--primary)';
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--surface)';
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        {collapsed
          ? <ChevronRight size={14} strokeWidth={2.5} />
          : <ChevronLeft  size={14} strokeWidth={2.5} />
        }
      </button>
    </aside>
  );
}