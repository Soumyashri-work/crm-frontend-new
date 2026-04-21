import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Ticket, Users, UserCircle,
  Settings, ChevronLeft, ChevronRight, ClipboardList,
  Building2, Shield, X,
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

// ─── Brand config per role ────────────────────────────────────────────────

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

// ─── Main Sidebar Component ────────────────────────────────────────────────

export default function Sidebar({ 
  role, 
  isAdmin, 
  isMobile = false,
  isOpen = false,
  onCollapsedChange,
  onNavigate,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { logout }                = useAuth();
  const navigate                  = useNavigate();

  // ─── Resolve role from props ──────────────────────────────────────────────
  const resolvedRole = role ?? (isAdmin ? 'admin' : 'agent');

  // ─── Get navigation and brand config for this role ───────────────────────
  const nav    = resolvedRole === 'superadmin' ? superAdminNav
               : resolvedRole === 'admin'      ? adminNav
               :                                 agentNav;

  const brand  = brandConfig[resolvedRole] ?? brandConfig.admin;
  const BrandIcon = brand.icon;

  // ─── Handle collapse button ───────────────────────────────────────────────
  const handleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  // ─── Handle logout ────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try { 
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`); 
    } catch (_) {}
    logout();
    navigate('/login');
  };

  // ─── Handle close sidebar on mobile ───────────────────────────────────────
  const handleClose = () => {
    onNavigate?.();
  };

  // ─── Handle navigation (close sidebar on mobile after click) ──────────────
  const handleNavClick = () => {
    onNavigate?.();
  };

  // ─── Computed: Sidebar should be hidden on mobile when closed ─────────────
  const isHiddenOnMobile = isMobile && !isOpen;

  // ─── Computed: Sidebar width based on collapse state ──────────────────────
  const currentSidebarWidth = collapsed 
    ? 'var(--sidebar-collapsed, 72px)'
    : 'var(--sidebar-width, 260px)';

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <aside
      style={{
        // ── Positioning ────────────────────────────────────────────────
        position:        'fixed',
        left:            0,
        top:             0,
        zIndex:          999,

        // ── Sizing ─────────────────────────────────────────────────────
        width:           currentSidebarWidth,
        height:          '100vh',

        // ── Styling ────────────────────────────────────────────────────
        background:      'var(--surface)',
        borderRight:     '1px solid var(--border)',

        // ── Layout ─────────────────────────────────────────────────────
        display:         'flex',
        flexDirection:   'column',
        overflow:        'visible',

        // ── Mobile Overlay Positioning (slide in from left) ────────────
        transform:       isHiddenOnMobile ? 'translateX(-100%)' : 'translateX(0)',
        transition:      'transform var(--transition-slow, 0.35s cubic-bezier(0.4,0,0.2,1)), width var(--transition-slow)',
        
        // ── Shadow for depth ───────────────────────────────────────────
        boxShadow:       isMobile && isOpen ? '4px 0 12px rgba(0,0,0,0.2)' : 'none',
        
        // ── Prevent layout shifts during animation ─────────────────────
        willChange:      'transform',
      }}
    >

      {/* ── Brand Section with Close Button ─────────────────────────────── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            'var(--space-md, 8px)',
        padding:        collapsed ? '18px 0' : '18px 24px',
        borderBottom:   '1px solid var(--border)',
        height:         'var(--navbar-height, 64px)',
        lineHeight:     1,
        flexShrink:     0,
        overflow:       'hidden',
      }}>
        {/* Brand Icon + Text Container */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            'var(--space-md, 8px)',
          justifyContent: collapsed ? 'center' : 'flex-start',
          flex: 1,
          minWidth: 0,
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
            transition:      'all var(--transition)',
          }}>
            <BrandIcon size={18} color="white" />
          </div>

          {/* Brand Text (hidden when collapsed) */}
          {!collapsed && (
            <div style={{ 
              lineHeight: 1.2, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 0, 
              overflow: 'hidden',
              minWidth: 0,
            }}>
              <div style={{ 
                fontWeight: 700, 
                fontSize: 15, 
                lineHeight: 1.2, 
                margin: 0, 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {brand.title}
              </div>
              <div style={{ 
                fontSize: 11, 
                color: 'var(--text-muted)', 
                fontWeight: 400, 
                lineHeight: 1.2, 
                margin: 0, 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {brand.subtitle}
              </div>
            </div>
          )}
        </div>

        {/* ✅ NEW: Close Button for Mobile - Only show on mobile when sidebar is open */}
        {isMobile && (
          <button
            onClick={handleClose}
            title="Close sidebar"
            style={{
              position:   'relative',
              width:      32,
              height:     32,
              borderRadius: '6px',
              background: 'transparent',
              border:     'none',
              cursor:     'pointer',
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color:      'var(--text-secondary)',
              flexShrink: 0,
              transition: 'all var(--transition)',
              padding:    0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-light)';
              e.currentTarget.style.color = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* ── Navigation Links ──────────────────────────────────────────────── */}
      <nav style={{
        flex:          1,
        padding:       'var(--space-md, 12px) var(--space-sm, 10px)',
        display:       'flex',
        flexDirection: 'column',
        gap:           'var(--space-xs, 2px)',
        overflowX:     'hidden',
        overflowY:     'auto',
        minHeight:     0,
      }}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            onClick={handleNavClick}
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
              whiteSpace:     'nowrap',
              overflow:       'hidden',
              textOverflow:   'ellipsis',
              cursor:         'pointer',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon 
                  size={18} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  style={{ flexShrink: 0 }} 
                />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

     
      {/* ── Collapse Toggle Button (Desktop only) ────────────────────────── */}
      {!isMobile && (
        <button
          onClick={handleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{
            position: 'absolute',
            right: -14,
            top: 'calc(var(--navbar-height, 64px) + 24px)',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
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
      )}
    </aside>
  );
}