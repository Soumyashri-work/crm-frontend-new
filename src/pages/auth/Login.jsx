import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Ticket, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import api from '../../services/api';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

function InputField({ icon: Icon, type = 'text', placeholder, value, onChange, rightEl }) {
  return (
    <div style={{ position: 'relative' }}>
      <Icon size={16} style={{
        position: 'absolute', left: 13, top: '50%',
        transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
      }} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: '100%', padding: '11px 40px 11px 38px',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-2)', fontSize: 14,
          color: 'var(--text-primary)', outline: 'none',
          fontFamily: 'inherit', transition: 'all 0.2s',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface-2)'; e.target.style.boxShadow = 'none'; }}
      />
      {rightEl && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          {rightEl}
        </div>
      )}
    </div>
  );
}

export default function Login() {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ name: '', email: '', password: '', confirm: '' });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/admin/dashboard' : '/agent/dashboard', { replace: true });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get('error');
    if (err === 'access_denied') setError('Login was cancelled. Please try again.');
    else if (err) setError('Authentication failed. Please try again.');
  }, [location.search]);

  // Clear messages when switching tabs
  useEffect(() => { setError(''); setSuccess(''); }, [tab]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!signInForm.email || !signInForm.password) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login/email', signInForm);
      const { token, user } = res.data;
      login(token, user);
      navigate(user?.role === 'admin' || user?.role === 'Admin' ? '/admin/dashboard' : '/agent/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!signUpForm.name || !signUpForm.email || !signUpForm.password) { setError('Please fill in all fields.'); return; }
    if (signUpForm.password !== signUpForm.confirm) { setError('Passwords do not match.'); return; }
    if (signUpForm.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/register', { name: signUpForm.name, email: signUpForm.email, password: signUpForm.password });
      setSuccess('Account created! Please sign in.');
      setTab('signin');
      setSignInForm({ email: signUpForm.email, password: '' });
      setSignUpForm({ name: '', email: '', password: '', confirm: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/login`;
  };

  const eyeBtn = (show, setShow) => (
    <button type="button" onClick={() => setShow(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 50%, #F0F9FF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, flexDirection: 'column', gap: 16,
    }}>
      {/* Blobs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-120px', right: '-80px', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.09) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        <div className="card animate-in" style={{ padding: '36px 32px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(37,99,235,0.28)', marginBottom: 14,
            }}>
              <Ticket size={26} color="white" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Unified CRM</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, textAlign: 'center' }}>
              {tab === 'signin' ? 'Sign in to access your ticket dashboard' : 'Create your account to get started'}
            </p>
          </div>

          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: 'var(--surface-2)',
            borderRadius: 'var(--radius-sm)', padding: 3, marginBottom: 22,
          }}>
            {['signin', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
                  borderRadius: 'calc(var(--radius-sm) - 2px)', fontFamily: 'inherit',
                  fontSize: 13.5, fontWeight: 600, transition: 'all 0.2s',
                  background: tab === t ? 'var(--surface)' : 'transparent',
                  color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)',
              padding: '9px 13px', marginBottom: 16, color: '#DC2626', fontSize: 13,
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 'var(--radius-sm)',
              padding: '9px 13px', marginBottom: 16, color: '#16A34A', fontSize: 13,
            }}>
              {success}
            </div>
          )}

          {/* SIGN IN FORM */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InputField
                icon={Mail} type="email" placeholder="Email address"
                value={signInForm.email}
                onChange={e => setSignInForm(f => ({ ...f, email: e.target.value }))}
              />
              <InputField
                icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Password"
                value={signInForm.password}
                onChange={e => setSignInForm(f => ({ ...f, password: e.target.value }))}
                rightEl={eyeBtn(showPw, setShowPw)}
              />
              <div style={{ textAlign: 'right', marginTop: -4 }}>
                <a href="#" style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 500 }}>Forgot password?</a>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14.5, marginTop: 2, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InputField
                icon={User} type="text" placeholder="Full name"
                value={signUpForm.name}
                onChange={e => setSignUpForm(f => ({ ...f, name: e.target.value }))}
              />
              <InputField
                icon={Mail} type="email" placeholder="Email address"
                value={signUpForm.email}
                onChange={e => setSignUpForm(f => ({ ...f, email: e.target.value }))}
              />
              <InputField
                icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Password (min. 8 characters)"
                value={signUpForm.password}
                onChange={e => setSignUpForm(f => ({ ...f, password: e.target.value }))}
                rightEl={eyeBtn(showPw, setShowPw)}
              />
              <InputField
                icon={Lock} type={showConfirm ? 'text' : 'password'} placeholder="Confirm password"
                value={signUpForm.confirm}
                onChange={e => setSignUpForm(f => ({ ...f, confirm: e.target.value }))}
                rightEl={eyeBtn(showConfirm, setShowConfirm)}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14.5, marginTop: 2, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: '10px 20px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--surface)',
              cursor: googleLoading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
              fontFamily: 'inherit', transition: 'all var(--transition)',
              boxShadow: 'var(--shadow-sm)', opacity: googleLoading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!googleLoading) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
          >
            <GoogleIcon />
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <p style={{ marginTop: 18, fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            By continuing, you agree to our{' '}
            <a href="#" style={{ color: 'var(--primary)' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" style={{ color: 'var(--primary)' }}>Privacy Policy</a>.
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5, color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Unified CRM Ticket System
        </p>
      </div>
    </div>
  );
}
