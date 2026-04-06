import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getKeycloak } from '../auth/keycloak';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kc, setKc] = useState(null);
  
  // Prevents double-initialization in React Strict Mode
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    let mounted = true;

    getKeycloak().then((keycloak) => {
      // If already initialized, just sync and return
      if (keycloak.didInitialize) {
        if (mounted) {
          setKc(keycloak);
          if (keycloak.authenticated) {
            _syncUser(keycloak, mounted, setUser, setLoading);
          } else {
            setLoading(false);
          }
        }
        return;
      }

      keycloak
        .init({
          onLoad: 'check-sso', // Changed back to check-sso to avoid forced loops
          pkceMethod: 'S256',
          checkLoginIframe: false,
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        })
        .then((authenticated) => {
          if (!mounted) return;
          setKc(keycloak);

          if (authenticated) {
             window.kc = keycloak; // Temporary for testing
            _syncUser(keycloak, mounted, setUser, setLoading);
          } else {
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Keycloak init error:', err);
          if (mounted) {
            setError('Authentication service unavailable.');
            setLoading(false);
          }
        });

      keycloak.onTokenExpired = () => {
        keycloak
          .updateToken(70)
          .then((refreshed) => {
            if (refreshed && mounted) _syncUser(keycloak, mounted, setUser, setLoading);
          })
          .catch(() => {
            console.error("Failed to refresh token");
            keycloak.login();
          });
      };
    });

    return () => { mounted = false; };
  }, []);

  const login = () => { if (kc) kc.login(); };

  const logout = () => {
    if (kc) {
      kc.logout({ redirectUri: window.location.origin + '/login' });
    }
  };

  const value = {
    user,
    token: kc?.token ?? null,
    kc,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isTokenExpired: () => (kc ? !kc.authenticated : true),
  };

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.spinnerWrap}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Authenticating...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.errorBox}>
          <p style={styles.errorText}>⚠ {error}</p>
          <button style={styles.retryBtn} onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

async function _syncUser(keycloak, mounted, setUser, setLoading) {
  const p = keycloak.tokenParsed;
  if (!p || !mounted) return;

  const roles = p.realm_access?.roles ?? [];
  const filteredRoles = roles.filter((r) => ['admin', 'agent', 'superadmin'].includes(r));
  const primaryRole = filteredRoles.includes('superadmin') ? 'superadmin' : filteredRoles.includes('admin') ? 'admin' : 'agent';

  setUser({
    sub: p.sub,
    email: p.email ?? '',
    name: p.name ?? p.preferred_username ?? '',
    roles: filteredRoles,
    role: primaryRole,
    tenant_id: p.tenant_id ?? null,
  });
  
  setLoading(false);

  try {
    const meRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${keycloak.token}` }
    });
    if (meRes.ok) {
      const me = await meRes.json();
      if (mounted && me.tenant_id) {
        setUser((prev) => ({ ...prev, tenant_id: me.tenant_id }));
      }
    }
  } catch (err) {
    console.warn('Backend sync failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Loading / error styles
// ---------------------------------------------------------------------------

const styles = {
  loadingWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: 'var(--surface, #f8fafc)',
  },
  spinnerWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  spinner: {
    width: 40, height: 40, borderRadius: '50%',
    border: '3px solid #e2e8f0', borderTopColor: '#2563eb',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#64748b', fontSize: 14, margin: 0 },
  errorBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  errorText: { color: '#dc2626', fontSize: 14, textAlign: 'center', maxWidth: 320, margin: 0 },
  retryBtn: {
    padding: '8px 20px', background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14,
  },
};