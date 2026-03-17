import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title = 'Unified Tickets Dashboard' }) {
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

  return (
    <header style={{
      height: 'var(--navbar-height)',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16,
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: 500, position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          placeholder="Search tickets, accounts, customers..."
          style={{
            width: '100%', padding: '8px 12px 8px 36px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-2)', fontSize: 13.5,
            outline: 'none', transition: 'all var(--transition)',
            color: 'var(--text-primary)',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--surface)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface-2)'; }}
        />
      </div>

      {/* Title center */}
      <div style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
        <ChevronDown size={14} color="var(--text-muted)" />
      </div>

      {/* Right actions */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>

        {/* User menu */}
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
    </header>
  );
}
