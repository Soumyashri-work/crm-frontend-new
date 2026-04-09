/**
 * src/components/ProtectedRoute.jsx  — UPDATED for Keycloak
 *
 * Behaviour is identical to the original:
 *   - While loading: show spinner
 *   - Not authenticated: redirect to /login
 *   - adminOnly + not admin: redirect to /agent/dashboard
 *   - Otherwise: render children
 *
 * Change: instead of checking a stored JWT, it checks the live Keycloak
 * session via useAuth(). The isAuthenticated flag is set by AuthContext
 * only after Keycloak.init() confirms the session is valid.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--surface, #f8fafc)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid #e2e8f0', borderTopColor: '#2563eb',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Super admins bypass the adminOnly check — they can access everything
  if (adminOnly && !isAdmin && user?.role !== 'superadmin') {
    return <Navigate to="/agent/dashboard" replace />;
  }

  return children;
}