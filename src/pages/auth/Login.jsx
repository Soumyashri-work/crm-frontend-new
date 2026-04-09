import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Ticket, ArrowRight, Lock } from 'lucide-react';
import { getKeycloak } from '../../auth/keycloak';

export default function Login() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Auto-redirect if Keycloak session is already active
  useEffect(() => {
    if (isAuthenticated) {
      const role = user?.role;
      if (role === 'superadmin') navigate('/superadmin/dashboard', { replace: true });
      else if (role === 'admin') navigate('/admin/dashboard', { replace: true });
      else navigate('/agent/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const kc = await getKeycloak();
      // This will redirect the user to your Keycloak Login Page
      await kc.login();
    } catch (error) {
      console.error("Login redirect failed:", error);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 50%, #F0F9FF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, flexDirection: 'column',
    }}>
      {/* Decorative Background Elements */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-120px', right: '-80px', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>
        <div className="card animate-in" style={{ 
          padding: '40px 32px', 
          borderRadius: 24,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)'
        }}>
          {/* Brand Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(37,99,235,0.25)', marginBottom: 16,
            }}>
              <Ticket size={30} color="white" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>Unified CRM</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', maxWidth: '240px', lineHeight: 1.5 }}>
              Securely sign in to manage your support tickets
            </p>
          </div>

          {/* Main Action */}
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%', 
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontSize: 16, 
                fontWeight: 600,
                borderRadius: 12,
                transition: 'transform 0.2s ease, background 0.2s ease',
                opacity: loading ? 0.8 : 1,
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              {loading ? (
                'Connecting...'
              ) : (
                <>
                  Login
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Security Note */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: 10, 
            padding: '16px', 
            background: '#F8FAFC', 
            borderRadius: 12,
            border: '1px solid #E2E8F0'
          }}>
            <Lock size={14} style={{ marginTop: 2, color: '#64748B' }} />
            <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              <strong>Invite Only:</strong> New accounts must be provisioned by an administrator.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#94A3B8' }}>
          © {new Date().getFullYear()} Unified CRM System
        </p>
      </div>
    </div>
  );
}