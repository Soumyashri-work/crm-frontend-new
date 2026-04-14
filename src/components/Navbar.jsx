import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title = 'Unified CRM Ticket Dashboard' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = async () => {
    try { await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`); } catch (_) {}
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || 'U').toUpperCase();

  // Superadmin has no tenant — show a neutral platform label instead
  const isSuperAdmin = user?.role === 'superadmin';
  const orgLabel = isSuperAdmin ? 'Platform' : (user?.tenant_name ?? '…');
  const orgInitial = isSuperAdmin ? 'P' : (user?.tenant_name?.[0] ?? '…');

  return (
    <header style={{
      height: 'var(--navbar-height)',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16,
      position: 'sticky', top: 0, zIndex: 100,
      lineHeight: 1,
    }}>
      {/* Organization name — left side (hidden on mobile) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: isSuperAdmin ? '#6366F1' : '#3B82F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0,
        }}>
          {orgInitial}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {orgLabel}
          </div>
        </div>
      </div>

      {/* Title — absolutely centered (hidden on mobile) */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <span style={{ fontWeight: 600, fontSize: 18 }}>{title}</span>
      </div>

      {/* Right actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 8px', borderRadius: 'var(--radius-sm)',
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: user?.picture ? 'transparent' : 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {user?.picture
                ? <img src={user.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{initials}</span>
              }
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.2 }}>{user?.name || 'User'}</div>
              <div style={{
                fontSize: 11, fontWeight: 600, color: 'var(--primary)',
                background: 'var(--primary-light)', padding: '1px 7px', borderRadius: 99,
              }}>
                {user?.role?.toUpperCase() || 'USER'}
              </div>
            </div>
          </button>

          {dropOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
              minWidth: 180, zIndex: 200, overflow: 'hidden',
            }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '10px 16px', background: 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontSize: 13.5, color: 'var(--danger)', fontFamily: 'inherit',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 820px) {
          header {
            padding: 0 14px 0 50px !important;
            gap: 0 !important;
          }
          header > div:first-child {
            display: none !important;
          }
          header > div:nth-child(2) {
            position: absolute !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            font-size: 13px !important;
          }
          header button > div:nth-child(2) {
            display: none !important;
          }
        }

        @media (max-width: 640px) {
          header {
            padding: 0 12px 0 48px !important;
          }
          header > div:nth-child(2) {
            font-size: 12px !important;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      `}</style>
    </header>
  );
}