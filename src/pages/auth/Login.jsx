/**
 * src/pages/auth/Login.jsx  — UPDATED for Keycloak
 *
 * Existing UI is fully preserved (logo, tabs, Google button).
 * The "Sign In" tab now redirects to Keycloak login page via kc.login().
 * The "Sign Up" tab is hidden — users are invited only (no self-registration).
 * The Google button is kept but now triggers Keycloak's IdP hint for Google.
 *
 * If already authenticated (Keycloak check-sso succeeded), redirects immediately.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Ticket } from 'lucide-react';
import { getKeycloak } from '../../auth/keycloak';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Login() {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // If already authenticated via Keycloak check-sso, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      const role = user?.role;
      if (role === 'superadmin') navigate('/superadmin/dashboard', { replace: true });
      else if (role === 'admin') navigate('/admin/dashboard', { replace: true });
      else navigate('/agent/dashboard', { replace: true });
    }
  }, [isAuthenticated, user]);

  const handleKeycloakLogin = async () => {
    setLoading(true);
    try {
      const kc = await getKeycloak();
      kc.login();
    } catch {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const kc = await getKeycloak();
      kc.login({ idpHint: 'google' });
    } catch {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 50%, #F0F9FF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, flexDirection: 'column', gap: 16,
    }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-120px', right: '-80px', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.09) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        <div className="card animate-in" style={{ padding: '36px 32px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(37,99,235,0.28)', marginBottom: 14,
            }}>
              <Ticket size={26} color="white" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Unified CRM</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, textAlign: 'center' }}>
              Sign in to access your ticket dashboard
            </p>
          </div>

          {/* Sign in button */}
          <button
            onClick={handleKeycloakLogin}
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%', justifyContent: 'center',
              padding: '12px', fontSize: 15, marginBottom: 14,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Redirecting...' : 'Sign In with SSO'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 14px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: '10px 20px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--surface)',
              cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
              fontFamily: 'inherit', transition: 'all var(--transition)',
              boxShadow: 'var(--shadow-sm)', opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--surface-2)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Invite note */}
          <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            New users are added by invitation only.{' '}
            <br />Contact your administrator to get access.
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5, color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Unified CRM Ticket System
        </p>
      </div>
    </div>
  );
}