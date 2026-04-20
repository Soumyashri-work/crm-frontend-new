import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, ChevronDown, ChevronLeft, ChevronRight,
  RefreshCw, Loader2, Edit2, Trash2, X, Shield, Copy, CheckCircle
} from 'lucide-react';
import { User, Mail } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import AddAdminModal from '../../components/superadmin/AddAdminModal';
import { superAdminService } from '../../services/superAdminService';

// Modal styles
const ms = {
  overlay: { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: 480, border: '1px solid var(--border)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' },
  iconBox: { width: 38, height: 38, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' },
  inputIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' },
  input: { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 },
  fieldError: { fontSize: 11.5, color: 'var(--danger)', marginTop: 4 },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid var(--border)' },
  cancelBtn: { padding: '9px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn: { padding: '9px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, border: 'none', fontFamily: 'inherit' },
  errorBanner: { marginBottom: 16, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 'var(--radius-sm)', fontSize: 13 },
  spin: { animation: 'spin 1s linear infinite' },
};

// --- Password Setup Link Modal ---
// Shown after a new admin is successfully created; displays the setup link
// returned by the API so the superadmin can share it with the new admin.
function PasswordSetupLinkModal({ setupLink, adminName, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(setupLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = setupLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div style={ms.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...ms.modal, maxWidth: 520 }} role="dialog" aria-modal="true">
        <div style={ms.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ ...ms.iconBox, background: '#059669' }}>
              <CheckCircle size={18} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Admin Created</h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
                Share the password setup link with {adminName || 'the admin'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={ms.closeBtn} aria-label="Close"><X size={18} /></button>
        </div>

        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            The admin account has been created. Send the link below to the admin so they can set their password and activate their account.
          </p>

          <label style={ms.label}>Password Setup Link</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              readOnly
              value={setupLink}
              style={{
                ...ms.input,
                flex: 1,
                background: 'var(--surface-2)',
                color: 'var(--text-secondary)',
                fontSize: 12.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onFocus={e => e.target.select()}
            />
            <button
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy link'}
              style={{
                flexShrink: 0,
                padding: '9px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: copied ? '#ECFDF5' : 'var(--surface)',
                color: copied ? '#059669' : 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>
            ⚠️ This link will expire. Share it with the admin as soon as possible. The admin will appear as <strong>Pending</strong> until they complete setup.
          </p>
        </div>

        <div style={ms.footer}>
          <button onClick={onClose} style={ms.submitBtn}>Done</button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// --- Action Menu Component using Portals ---
function ActionMenu({ anchorEl, onEdit, onClose }) {
  const [coords, setCoords] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const menuHeight = 85;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < (menuHeight + 20);
    setCoords({
      top: openUp ? rect.top - menuHeight - 8 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  }, [anchorEl]);

  if (!anchorEl) return null;

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={onClose} />
      <div style={{
        position: 'fixed',
        top: coords.top,
        right: coords.right,
        zIndex: 9999,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-lg)',
        minWidth: 140,
        overflow: 'hidden',
        animation: 'fadeInScale 0.1s ease-out'
      }}>
        <style>{`
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <button
          onClick={() => { onEdit(); onClose(); }}
          style={{ width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Edit
        </button>
        <button
          onClick={(e) => { e.preventDefault(); onClose(); }}
          style={{ width: '100%', padding: '9px 14px', border: 'none', borderTop: '1px solid var(--border-light)', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'var(--danger)', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Delete
        </button>
      </div>
    </>,
    document.body
  );
}

// --- Edit Admin Modal Component ---
function EditAdminModal({ admin, onClose, onSave }) {
  const nameParts = (admin?.name || '').split(' ');
  const [form, setForm] = useState({
    first_name: admin?.first_name || nameParts[0] || '',
    last_name: admin?.last_name || nameParts.slice(1).join(' ') || '',
    admin_email: admin?.email || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  function validate() {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required.';
    if (!form.last_name.trim()) e.last_name = 'Last name is required.';
    if (!form.admin_email.trim()) e.admin_email = 'Admin email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.admin_email)) e.admin_email = 'Enter a valid email.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setApiError('');
    try {
      onSave({
        ...admin,
        name: `${form.first_name.trim()} ${form.last_name.trim()}`,
        email: form.admin_email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });
      onClose();
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function field(key, value) {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  }

  return (
    <div style={ms.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={ms.modal} role="dialog" aria-modal="true">
        <div style={ms.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={ms.iconBox}><Shield size={18} color="white" /></div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Edit Admin</h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>Update admin details</p>
            </div>
          </div>
          <button onClick={onClose} style={ms.closeBtn} aria-label="Close"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ padding: '24px 24px 0' }}>
            {apiError && <div style={ms.errorBanner} role="alert">{apiError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={ms.label}>First Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={ms.inputIcon} />
                  <input
                    style={{ ...ms.input, paddingLeft: 36, borderColor: errors.first_name ? 'var(--danger)' : undefined }}
                    placeholder="e.g. John"
                    value={form.first_name}
                    onChange={e => field('first_name', e.target.value)}
                    autoFocus
                  />
                </div>
                {errors.first_name && <p role="alert" style={ms.fieldError}>{errors.first_name}</p>}
              </div>
              <div>
                <label style={ms.label}>Last Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={ms.inputIcon} />
                  <input
                    style={{ ...ms.input, paddingLeft: 36, borderColor: errors.last_name ? 'var(--danger)' : undefined }}
                    placeholder="e.g. Anderson"
                    value={form.last_name}
                    onChange={e => field('last_name', e.target.value)}
                  />
                </div>
                {errors.last_name && <p role="alert" style={ms.fieldError}>{errors.last_name}</p>}
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={ms.label}>Admin Email <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={ms.inputIcon} />
                <input
                  type="email"
                  style={{ ...ms.input, paddingLeft: 36, borderColor: errors.admin_email ? 'var(--danger)' : undefined }}
                  placeholder="admin@company.com"
                  value={form.admin_email}
                  onChange={e => field('admin_email', e.target.value)}
                />
              </div>
              {errors.admin_email && <p role="alert" style={ms.fieldError}>{errors.admin_email}</p>}
            </div>
          </div>
          <div style={ms.footer}>
            <button type="button" onClick={onClose} style={ms.cancelBtn} disabled={submitting}>Cancel</button>
            <button type="submit" style={ms.submitBtn} disabled={submitting}>
              {submitting ? <><Loader2 size={14} style={ms.spin} /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// --- Main SuperAdminAdmins Page ---
export default function SuperAdminAdmins() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Password setup link state — shown after a new admin is created
  const [setupLinkData, setSetupLinkData] = useState(null); // { link, adminName }

  const fetchAdmins = useCallback(async (signal) => {
    setLoading(true); setError('');
    try {
      const data = await superAdminService.getAdmins();
      if (signal?.aborted) return;
      setAdmins(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (err) {
      if (signal?.aborted) return;
      setError('Could not load admins. Please try again.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAdmins(controller.signal);
    return () => controller.abort();
  }, [fetchAdmins]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filtered = admins.filter(a => {
    const status = a.is_pending ? 'Pending' : (a.is_active ? 'Active' : 'Inactive');
    if (statusFilter && status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.email.toLowerCase().includes(q) ||
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.tenant_name && a.tenant_name.toLowerCase().includes(q));
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / recordsPerPage);
  const currentRecords = filtered.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  /**
   * Called by AddAdminModal after a successful API response.
   *
   * The modal / service is expected to return an object like:
   *   {
   *     admin_name: string,        // full name of created admin
   *     admin_email: string,       // email
   *     setup_link: string,        // password-setup URL from the API
   *     tenant: { id, name },
   *     ...
   *   }
   *
   * We optimistically add the new admin row (Pending status) and then
   * show the PasswordSetupLinkModal so the superadmin can copy & share the link.
   */
  const handleAddAdmin = (result) => {
    // Optimistically add to the list
    setAdmins(prev => [{
      id: result.id || Date.now(),
      email: result.admin_email,
      name: result.admin_name || result.admin_email,
      role: 'admin',
      tenant_id: result.tenant?.id ?? '',
      tenant_name: result.tenant?.name ?? '—',
      is_active: false,
      is_pending: true,
      created_at: new Date().toISOString(),
    }, ...prev]);

    // If the API returned a setup link, show it in a modal
    const setupLink = result.setup_link || result.password_setup_link || result.invite_link;
    if (setupLink) {
      setSetupLinkData({
        link: setupLink,
        adminName: result.admin_name || result.admin_email || 'the admin',
      });
    }
  };

  const handleSaveEdit = (updated) => {
    setAdmins(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const hasActive = search || statusFilter;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Password Setup Link Modal — shown after adding a new admin */}
      {setupLinkData && (
        <PasswordSetupLinkModal
          setupLink={setupLinkData.link}
          adminName={setupLinkData.adminName}
          onClose={() => setSetupLinkData(null)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {/* Breadcrumb — "Dashboard" is plain text that navigates on click, not styled blue */}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              onClick={() => navigate('/superadmin/dashboard')}
              style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Dashboard
            </span>
            <span style={{ margin: '0 2px' }}>›</span>
            <span style={{ color: 'var(--text-secondary)' }}>Admins</span>
          </div>
          <h1>Admins</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 4 }}>Manage admin users across all tenants</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', fontSize: 14 }}>
          <Plus size={16} /> Add Admin
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="filter-toolbar">
        <div className="filter-search-row">
          <Search size={16} className="filter-search-icon" />
          <input
            className="filter-search-input"
            placeholder="Search by name, email or tenant…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-dropdowns-row">
          <div className="filter-select-wrap">
            <select className={`filter-select${statusFilter ? ' active' : ''}`} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
            <ChevronDown size={13} className="filter-chevron" />
          </div>
          <button
            onClick={() => fetchAdmins()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1.5px solid var(--border-dark)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          {hasActive && (
            <button className="filter-clear-btn" onClick={() => { setSearch(''); setStatusFilter(''); }}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#B91C1C', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => fetchAdmins()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C', fontSize: 13, fontFamily: 'inherit', textDecoration: 'underline' }}>Retry</button>
        </div>
      )}

      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ADMIN</th>
                <th>TENANT</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>CREATED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                </td></tr>
              ) : currentRecords.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  {search || statusFilter ? 'No admins match your search.' : 'No admins found.'}
                </td></tr>
              ) : currentRecords.map((a, i) => (
                <tr key={a.id} className="animate-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: getAvatarColor(a.name || a.email), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
                        {getInitials(a.name || a.email)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#000' }}>{a.name || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'var(--primary-light)', color: 'var(--primary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.tenant_name || '—'}
                    </span>
                  </td>
                  <td><span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: '#F3E8FF', color: '#7C3AED' }}>{a.role}</span></td>
                  <td>
                    {a.is_pending ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', display: 'inline-block' }} /> Pending
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: a.is_active ? '#ECFDF5' : '#FEF2F2', color: a.is_active ? '#059669' : '#B91C1C', border: `1px solid ${a.is_active ? '#A7F3D0' : '#FCA5A5'}` }}>
                        {a.is_active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />}
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{formatDate(a.created_at)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="row-actions">
                      <button
                        className="icon-action-btn edit"
                        type="button"
                        title="Edit admin"
                        aria-label="Edit admin"
                        onClick={() => setEditingAdmin(a)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="icon-action-btn delete"
                        type="button"
                        title="Delete admin (coming soon)"
                        aria-label="Delete admin"
                        disabled
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Showing <strong>{(currentPage - 1) * recordsPerPage + 1}</strong> to <strong>{Math.min(currentPage * recordsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong>
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{ width: 32, height: 32, borderRadius: 6, border: 'none', fontSize: 13, fontWeight: currentPage === page ? 600 : 400, background: currentPage === page ? 'var(--primary)' : 'transparent', color: currentPage === page ? 'white' : 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {!loading && totalPages <= 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
            Showing {filtered.length} of {admins.length} admins
          </div>
        )}
      </div>

      <AddAdminModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleAddAdmin} />
    </div>
  );
}