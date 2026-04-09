/**
 * src/pages/auth/AuthCallback.jsx  — UPDATED for Keycloak
 *
 * Keycloak handles its own PKCE code exchange internally via keycloak-js.
 * This page is kept as a fallback/loading state while Keycloak initialises
 * and AuthContext redirects the user to their dashboard.
 *
 * The previous OAuth callback logic (exchanging code for token) is removed —
 * keycloak-js does this automatically in keycloak.init().
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AuthCallback() {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (isAuthenticated && user) {
      const role = user.role;
      if (role === 'superadmin') navigate('/superadmin/dashboard', { replace: true });
      else if (role === 'admin')  navigate('/admin/dashboard',     { replace: true });
      else                        navigate('/agent/dashboard',      { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, user, loading]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 16,
      background: 'var(--surface, #f8fafc)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid #e2e8f0', borderTopColor: '#2563eb',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
        Completing sign-in...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}