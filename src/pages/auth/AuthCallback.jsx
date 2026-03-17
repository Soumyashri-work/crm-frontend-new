import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    const errorParam = params.get('error');

    if (errorParam) {
      if (errorParam === 'access_denied') {
        navigate('/login?error=access_denied', { replace: true });
      } else {
        navigate('/login?error=auth_failed', { replace: true });
      }
      return;
    }

    if (!token) {
      navigate('/login?error=auth_failed', { replace: true });
      return;
    }

    try {
      const user = userParam ? JSON.parse(decodeURIComponent(userParam)) : {};
      login(token, user);
      const dest = user?.role === 'admin' || user?.role === 'Admin'
        ? '/admin/dashboard'
        : '/agent/dashboard';
      navigate(dest, { replace: true });
    } catch {
      navigate('/login?error=auth_failed', { replace: true });
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '4px solid var(--border)',
        borderTopColor: 'var(--primary)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
        Completing sign in…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
