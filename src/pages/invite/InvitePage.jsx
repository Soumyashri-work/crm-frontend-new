/**
 * src/pages/invite/InvitePage.jsx
 *
 * Handles Flow 1 Part B and Flow 2 Part B from the diagrams.
 * Shown when a user clicks the invite link:  /invite?token=xxx
 *
 * Steps:
 *   1. On load: GET /invitations/validate?token=xxx
 *      → shows "You are joining ACME Corp as Admin"
 *   2. User sets password and clicks Join Now
 *   3. POST /invitations/accept { token, password }
 *      → backend marks token used, sets password in Keycloak, creates DashboardUser
 *   4. Show ProvisionCredentialsForm modal → provision CRM integration
 *   5. On success → redirect to /login
 *
 * Token is NEVER reusable after accept — backend marks it immediately.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Ticket, Eye, EyeOff } from 'lucide-react';
import ProvisionCredentialsForm from '../../components/ProvisionCredentialsForm';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export default function InvitePage() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const token     = params.get('token');

  const [invite,            setInvite]            = useState(null);
  const [password,          setPassword]          = useState('');
  const [confirm,           setConfirm]           = useState('');
  const [showPw,            setShowPw]            = useState(false);
  const [showCf,            setShowCf]            = useState(false);
  const [error,             setError]             = useState('');
  const [success,           setSuccess]           = useState(false);
  const [loading,           setLoading]           = useState(false);
  const [validating,        setValidating]        = useState(true);
  const [showProvisionForm, setShowProvisionForm] = useState(false);

  // ── Step 1: validate token on mount ─────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setError('No invite token found in the URL.');
      setValidating(false);
      return;
    }

    fetch(`${API}/invitations/validate?token=${encodeURIComponent(token)}`)
      .then((r) => {
        if (r.status === 404) throw new Error('Invite link not found or already expired.');
        if (r.status === 410) throw new Error('This invite link has already been used or has expired.');
        if (!r.ok) throw new Error('Failed to validate invite.');
        return r.json();
      })
      .then((data) => { setInvite(data); setValidating(false); })
      .catch((e)   => { setError(e.message); setValidating(false); });
  }, [token]);

  // ── Step 2: accept invite ────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('');

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.'); return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.'); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/invitations/accept`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to activate account.');
      setSuccess(true);
      setShowProvisionForm(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Provision form handlers ──────────────────────────────────────────────
  const handleProvisionSuccess = (data) => {
    console.log('New integration provisioned:', data.integration_id);
    // Auto-navigate to login after successful provisioning
    navigate('/login');
  };

  const handleProvisionClose = () => {
    setShowProvisionForm(false);
    // Redirect to login if user dismisses without provisioning
    navigate('/login');
  };

  // ── Render states ────────────────────────────────────────────────────────

  if (validating) {
    return (
      <Screen>
        <Spinner text="Validating your invite link..." />
      </Screen>
    );
  }

  if (error && !invite) {
    return (
      <Screen>
        <div style={s.card}>
          <div style={s.iconWrap}>⛔</div>
          <h2 style={s.title}>Invalid Invite</h2>
          <p style={s.sub}>{error}</p>
          <button style={s.btn} onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </Screen>
    );
  }

  if (success && !showProvisionForm) {
    return (
      <Screen>
        <div style={s.card}>
          <div style={s.iconWrap}>✅</div>
          <h2 style={s.title}>Account Activated!</h2>
          <p style={s.sub}>
            You've joined <strong style={{ color: 'var(--primary)' }}>{invite?.tenant_name}</strong>{' '}
            as <strong>{invite?.role}</strong>.
          </p>
          <p style={{ ...s.sub, marginTop: 8 }}>You can now sign in with your email and password.</p>
          <button style={s.btn} onClick={() => navigate('/login')}>
            Go to Login →
          </button>
        </div>
      </Screen>
    );
  }

  return (
    <>
      <Screen>
        <div style={s.card}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ticket size={22} color="white" />
            </div>
            <div>
              <div style={s.badge}>{invite?.role?.toUpperCase()}</div>
            </div>
          </div>

          <h1 style={s.title}>Join {invite?.tenant_name}</h1>
          <p style={s.sub}>
            You're being added as <strong>{invite?.role}</strong> to{' '}
            <strong>{invite?.tenant_name}</strong>.
          </p>
          <p style={s.email}>📧 {invite?.email}</p>

          <div style={s.divider} />

          {/* Password fields */}
          <label style={s.label}>Set your password</label>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              type={showPw ? 'text' : 'password'}
              style={s.input}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              style={s.eyeBtn}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <label style={s.label}>Confirm password</label>
          <div style={{ position: 'relative', marginBottom: 4 }}>
            <input
              type={showCf ? 'text' : 'password'}
              style={s.input}
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              type="button"
              onClick={() => setShowCf((v) => !v)}
              style={s.eyeBtn}
            >
              {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button
            style={{ ...s.btn, marginTop: 20, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Activating...' : 'Join Now →'}
          </button>

          <p style={s.hint}>
            This invite link is valid for 24 hours and can only be used once.
          </p>
        </div>
      </Screen>

      {/* Provision Credentials Form Modal */}
      {showProvisionForm && (
        <ProvisionCredentialsForm
          modal={true}
          onClose={handleProvisionClose}
          onSuccess={handleProvisionSuccess}
          apiBase=""
        />
      )}
    </>
  );
}

function Screen({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 50%, #F0F9FF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      {children}
    </div>
  );
}

function Spinner({ text }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid #e2e8f0', borderTopColor: '#2563eb',
        animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
      }} />
      <p style={{ color: '#64748b', fontSize: 14 }}>{text}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const s = {
  card: {
    background: 'var(--surface, #fff)',
    borderRadius: 16, padding: '36px 32px',
    width: '100%', maxWidth: 440,
    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
    border: '1px solid var(--border, #e2e8f0)',
  },
  badge: {
    display: 'inline-block', background: '#EFF6FF', color: '#1d4ed8',
    fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
    padding: '3px 10px', borderRadius: 20,
  },
  title: { color: 'var(--text-primary)', fontSize: 22, margin: '0 0 8px', fontWeight: 700 },
  sub:   { color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 6px', lineHeight: 1.6 },
  email: { color: 'var(--primary)', fontSize: 13, margin: '4px 0 0' },
  divider: { height: 1, background: 'var(--border)', margin: '20px 0' },
  label: { display: 'block', color: 'var(--text-primary)', fontSize: 13, marginBottom: 6, fontWeight: 500 },
  input: {
    width: '100%', padding: '10px 38px 10px 14px',
    border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', background: 'var(--surface-2)',
    fontFamily: 'inherit',
  },
  eyeBtn: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
  },
  error: {
    color: '#dc2626', fontSize: 13, margin: '8px 0 0',
    padding: '8px 12px', background: '#fef2f2',
    borderRadius: 6, border: '1px solid #fca5a5',
  },
  btn: {
    display: 'block', width: '100%', padding: '12px',
    background: 'var(--primary)', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 15, fontWeight: 600,
    cursor: 'pointer', textAlign: 'center', textDecoration: 'none',
    fontFamily: 'inherit',
  },
  hint: { color: 'var(--text-muted)', fontSize: 12, marginTop: 12, textAlign: 'center' },
  iconWrap: { fontSize: 36, marginBottom: 12, textAlign: 'center' },
};