import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Navbar — shared across all roles.
 *
 * Props:
 *   title          string      Page title shown in center (optional)
 *   isMobile       boolean     Controls hamburger display
 *   sidebarOpen    boolean     Controls hamburger icon state
 *   onMenuToggle   () => void  Called when hamburger is clicked
 */
export default function Navbar({
  title       = 'Unified CRM Ticket Dashboard',
  isMobile    = false,
  sidebarOpen = false,
  onMenuToggle,
}) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef();

  // Close dropdown when clicking outside
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
    : (user?.email?.[0] || 'U').toUpperCase();

  const isSuperAdmin = user?.role === 'superadmin';
  const orgLabel     = isSuperAdmin ? 'Platform'          : (user?.tenant_name ?? '…');
  const orgInitial   = isSuperAdmin ? 'P'                 : (user?.tenant_name?.[0] ?? '…');
  const orgBg        = isSuperAdmin ? '#6366F1'           : '#3B82F6';

  return (
    <header style={{
      height:       'var(--navbar-height)',
      background:   'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display:      'flex',
      alignItems:   'center',
      padding:      isMobile ? '0 16px 0 50px' : '0 24px',
      gap:          16,
      position:     'sticky',
      top:          0,
      zIndex:       100,
      lineHeight:   1,
      width:        '100%',
      flexShrink:   0,
    }}>

      {/* ── Mobile hamburger ────────────────────────────────────────────── */}
      {isMobile && onMenuToggle && (
        <button
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
          style={{
            position:   'absolute',
            left:       12,
            background: 'none',
            border:     'none',
            cursor:     'pointer',
            padding:    '4px',
            display:    'flex',
            alignItems: 'center',
            color:      'var(--text-primary)',
          }}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      {/* ── Org name — left (hidden on mobile) ──────────────────────────── */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
          <div style={{
            width:          32,
            height:         32,
            borderRadius:   8,
            background:     orgBg,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       14,
            fontWeight:     700,
            color:          'white',
            flexShrink:     0,
          }}>
            {orgInitial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
              {orgLabel}
            </div>
          </div>
        </div>
      )}

      {/* ── Title — absolutely centered ──────────────────────────────────── */}
      <div style={{
        position:       'absolute',
        left:           '50%',
        transform:      'translateX(-50%)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            6,
        pointerEvents:  'none',
      }}>
        <span style={{
          fontWeight: 600,
          fontSize:   isMobile ? 14 : 18,
          color:      'var(--text-primary)',
          whiteSpace: 'nowrap',
        }}>
          {title}
        </span>
      </div>

      {/* ── User dropdown — right ─────────────────────────────────────────── */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative' }} ref={dropRef}>
          <button
            onClick={() => setDropOpen(o => !o)}
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        10,
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              padding:    '4px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {/* Avatar */}
            <div style={{
              width:          34,
              height:         34,
              borderRadius:   '50%',
              background:     user?.picture ? 'transparent' : 'var(--primary)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              overflow:       'hidden',
              flexShrink:     0,
            }}>
              {user?.picture
                ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{initials}</span>
              }
            </div>

            {/* Name + role badge (hidden on mobile) */}
            {!isMobile && (
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.2, color: 'var(--text-primary)' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{
                  fontSize:     10,
                  fontWeight:   800,
                  color:        'var(--primary)',
                  background:   'var(--primary-light)',
                  padding:      '1px 7px',
                  borderRadius: 99,
                  display:      'inline-block',
                  marginTop:    2,
                  textTransform: 'uppercase',
                }}>
                  {user?.role?.toUpperCase() || 'USER'}
                </div>
              </div>
            )}
          </button>

          {/* Dropdown menu */}
          {dropOpen && (
            <div style={{
              position:     'absolute',
              right:        0,
              top:          'calc(100% + 8px)',
              background:   'var(--surface)',
              border:       '1.5px solid var(--border-dark)',
              borderRadius: 'var(--radius-sm)',
              boxShadow:    'var(--shadow-lg)',
              width:        210,
              zIndex:       200,
              overflow:     'hidden',
            }}>
              <div style={{
                padding:      '12px 16px',
                borderBottom: '1px solid var(--border-light)',
                background:   'white',
              }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#000', lineHeight: 1.2 }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  {user?.email}
                </div>
              </div>
              <div style={{ padding: '4px' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width:        '100%',
                    padding:      '10px 12px',
                    background:   'none',
                    border:       'none',
                    cursor:       'pointer',
                    textAlign:    'left',
                    color:        'var(--danger)',
                    fontSize:     13,
                    fontWeight:   500,
                    borderRadius: '4px',
                    transition:   'background 0.2s',
                    fontFamily:   'inherit',
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
      </div>
    </header>
  );
}