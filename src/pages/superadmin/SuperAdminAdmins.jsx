/**
 * src/pages/superadmin/SuperAdminAdmins.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, Edit2, Trash2, X, Shield, CheckCircle,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { User, Mail } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import AddAdminModal from '../../components/superadmin/AddAdminModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { superAdminService } from '../../services/superAdminService';
import { StatusBadge } from './SuperAdminTenants';

// ─── Modal styles ────────────────────────────────────────────────────
const ms = {
  overlay:     { position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modal:       { background:'var(--surface)', borderRadius:'var(--radius)', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', width:'100%', maxWidth:480, border:'1px solid var(--border)' },
  header:      { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid var(--border)' },
  iconBox:     { width:38, height:38, borderRadius:10, background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center' },
  closeBtn:    { background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' },
  inputIcon:   { position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' },
  input:       { width:'100%', padding:'9px 12px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--surface)', fontSize:13.5, outline:'none', fontFamily:'inherit', boxSizing:'border-box' },
  label:       { display:'block', fontSize:13, fontWeight:600, marginBottom:6 },
  fieldError:  { fontSize:11.5, color:'var(--danger)', marginTop:4 },
  footer:      { display:'flex', justifyContent:'flex-end', gap:10, padding:'16px 24px', borderTop:'1px solid var(--border)' },
  cancelBtn:   { padding:'9px 18px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', fontFamily:'inherit' },
  submitBtn:   { padding:'9px 20px', borderRadius:'var(--radius-sm)', background:'var(--primary)', color:'white', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:7, border:'none', fontFamily:'inherit' },
  errorBanner: { marginBottom:16, padding:'10px 14px', background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', borderRadius:'var(--radius-sm)', fontSize:13 },
  spin:        { animation:'spin 1s linear infinite' },
};

// ─── Sort icon helper ─────────────────────────────────────────────────
function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ArrowUpDown size={12} style={{ marginLeft:4, opacity:0.4, verticalAlign:'middle' }} />;
  return sortDir === 'asc'
    ? <ArrowUp   size={12} style={{ marginLeft:4, color:'var(--primary)', verticalAlign:'middle' }} />
    : <ArrowDown size={12} style={{ marginLeft:4, color:'var(--primary)', verticalAlign:'middle' }} />;
}

// ─── Success Toast ────────────────────────────────────────────────────
function SuccessToast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', borderRadius: 'var(--radius-sm)',
      background: '#ECFDF5', border: '1px solid #6EE7B7',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      fontSize: 13, fontWeight: 500, color: '#065F46',
      animation: 'slideIn 0.2s ease',
    }}>
      <CheckCircle size={16} color="#059669" style={{ flexShrink: 0 }} />
      {message}
      <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#059669', marginLeft:4, padding:2, display:'flex' }}>
        <X size={14} />
      </button>
      <style>{`@keyframes slideIn { from { transform: translateY(8px); opacity:0; } to { transform: translateY(0); opacity:1; } }`}</style>
    </div>
  );
}

// ─── Edit Admin Modal ─────────────────────────────────────────────────
function EditAdminModal({ admin, onClose, onSave }) {
  const nameParts = (admin?.name || '').split(' ');
  const [form, setForm] = useState({
    first_name:  admin?.first_name  || nameParts[0] || '',
    last_name:   admin?.last_name   || nameParts.slice(1).join(' ') || '',
    admin_email: admin?.email || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState({});
  const [apiError, setApiError]     = useState('');

  function validate() {
    const e = {};
    if (!form.first_name.trim())  e.first_name  = 'First name is required.';
    if (!form.last_name.trim())   e.last_name   = 'Last name is required.';
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
      const fullName = `${form.first_name.trim()} ${form.last_name.trim()}`;
      const updated = await onSave(admin.id, {
        name:  fullName,
        email: form.admin_email.trim(),
      });
      onClose(updated);
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function field(key, value) {
    setForm(f => ({ ...f, [key]:value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]:'' }));
  }

  return (
    <div style={ms.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={ms.modal} role="dialog" aria-modal="true">
        <div style={ms.header}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={ms.iconBox}><Shield size={18} color="white" /></div>
            <div>
              <h2 style={{ fontSize:17, fontWeight:700, margin:0 }}>Edit Admin</h2>
              <p style={{ fontSize:12.5, color:'var(--text-muted)', margin:0 }}>Update admin details</p>
            </div>
          </div>
          <button onClick={onClose} style={ms.closeBtn} aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ padding:'24px 24px 0' }}>
            {apiError && <div style={ms.errorBanner} role="alert">{apiError}</div>}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
              <div>
                <label style={ms.label}>First Name <span style={{ color:'var(--danger)' }}>*</span></label>
                <div style={{ position:'relative' }}>
                  <User size={15} style={ms.inputIcon} />
                  <input style={{ ...ms.input, paddingLeft:36, borderColor:errors.first_name ? 'var(--danger)' : undefined }} placeholder="e.g. John" value={form.first_name} onChange={e => field('first_name', e.target.value)} autoFocus />
                </div>
                {errors.first_name && <p role="alert" style={ms.fieldError}>{errors.first_name}</p>}
              </div>
              <div>
                <label style={ms.label}>Last Name <span style={{ color:'var(--danger)' }}>*</span></label>
                <div style={{ position:'relative' }}>
                  <User size={15} style={ms.inputIcon} />
                  <input style={{ ...ms.input, paddingLeft:36, borderColor:errors.last_name ? 'var(--danger)' : undefined }} placeholder="e.g. Anderson" value={form.last_name} onChange={e => field('last_name', e.target.value)} />
                </div>
                {errors.last_name && <p role="alert" style={ms.fieldError}>{errors.last_name}</p>}
              </div>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={ms.label}>Admin Email <span style={{ color:'var(--danger)' }}>*</span></label>
              <div style={{ position:'relative' }}>
                <Mail size={15} style={ms.inputIcon} />
                <input type="email" style={{ ...ms.input, paddingLeft:36, borderColor:errors.admin_email ? 'var(--danger)' : undefined }} placeholder="admin@company.com" value={form.admin_email} onChange={e => field('admin_email', e.target.value)} />
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

// ─── Main Page ────────────────────────────────────────────────────────
export default function SuperAdminAdmins() {
  const navigate = useNavigate();
  const [admins, setAdmins]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [editingAdmin, setEditingAdmin]   = useState(null);
  const [deletingAdmin, setDeletingAdmin] = useState(null);
  const [isDeleting, setIsDeleting]       = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);
  const [successToast, setSuccessToast]   = useState('');  // ← replaces setupLinkData
  const [sortField, setSortField]         = useState('');
  const [sortDir, setSortDir]             = useState('asc');
  const recordsPerPage = 10;

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

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  // ── Filtering & sorting ──────────────────────────────────────────────
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

  const sortedAdmins = (() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      let av, bv;
      if      (sortField === 'name')       { av = (a.name || a.email || '').toLowerCase();  bv = (b.name || b.email || '').toLowerCase(); }
      else if (sortField === 'tenant')     { av = (a.tenant_name || '').toLowerCase();       bv = (b.tenant_name || '').toLowerCase(); }
      else if (sortField === 'created_at') { av = a.created_at || '';                        bv = b.created_at || ''; }
      else                                 { av = String(a[sortField]||'').toLowerCase();    bv = String(b[sortField]||'').toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  })();

  const totalPages     = Math.ceil(sortedAdmins.length / recordsPerPage);
  const currentRecords = sortedAdmins.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  // ── Add: prepend optimistic row + show "Invite sent" toast ───────────
  const handleAddAdmin = (result) => {
    setAdmins(prev => [{
      id:          result.id || Date.now(),
      email:       result.admin_email,
      name:        result.admin_name || result.admin_email,
      role:        'admin',
      tenant_id:   result.tenant?.id ?? '',
      tenant_name: result.tenant?.name ?? '—',
      is_active:   false,
      is_pending:  true,
      created_at:  new Date().toISOString(),
    }, ...prev]);

    // Show toast — no link shown, matching previous UX
    const label = result.admin_name || result.admin_email || 'Admin';
    setSuccessToast(`Invite sent successfully to ${label}.`);
  };

  // ── Edit: calls PATCH /super-admin/admins/:id ────────────────────────
  const handleSaveEdit = async (adminId, patch) => {
    const updated = await superAdminService.updateAdmin(adminId, patch);
    setAdmins(prev =>
      prev.map(a => a.id === adminId
        ? { ...a, name: updated.name ?? a.name, email: updated.email ?? a.email }
        : a
      )
    );
    return updated;
  };

  // ── Delete: calls DELETE /super-admin/admins/:id ─────────────────────
  const handleDeleteConfirm = async () => {
    if (!deletingAdmin) return;
    setIsDeleting(true);
    try {
      await superAdminService.deleteAdmin(deletingAdmin.id);
      setAdmins(prev => prev.filter(a => a.id !== deletingAdmin.id));
      setDeletingAdmin(null);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  };

  const hasActive = search || statusFilter;

  const SortTh = ({ field, children, style }) => (
    <th style={{ cursor:'pointer', userSelect:'none', ...style }} onClick={() => handleSort(field)}>
      {children}<SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </th>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Edit Modal */}
      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirm Modal */}
      {deletingAdmin && (
        <ConfirmDeleteModal
          agent={deletingAdmin}
          isOpen={!!deletingAdmin}
          onClose={() => !isDeleting && setDeletingAdmin(null)}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}

      {/* Invite success toast — auto-dismisses after 4 s */}
      {successToast && (
        <SuccessToast message={successToast} onClose={() => setSuccessToast('')} />
      )}

      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span
              onClick={() => navigate('/superadmin/dashboard')}
              style={{ cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Dashboard
            </span>
            <span>›</span>
            <span style={{ color:'var(--text-secondary)' }}>Admins</span>
          </div>
          <h1>Admins</h1>
          <p>Manage admin users across all tenants</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={16} /> Add Admin
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="filter-toolbar">
        <div className="filter-search-row">
          <Search size={16} className="filter-search-icon" />
          <input className="filter-search-input" placeholder="Search by name, email or tenant…" value={search} onChange={e => setSearch(e.target.value)} />
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
          {hasActive && (
            <button className="filter-clear-btn" onClick={() => { setSearch(''); setStatusFilter(''); }}>Clear Filters</button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding:'12px 16px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--radius-sm)', fontSize:13, color:'#B91C1C', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          {error}
          <button onClick={() => fetchAdmins(new AbortController().signal)} style={{ background:'none', border:'none', cursor:'pointer', color:'#B91C1C', fontSize:13, fontFamily:'inherit', textDecoration:'underline' }}>Retry</button>
        </div>
      )}

      <div className="card" style={{ display:'flex', flexDirection:'column' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <SortTh field="name">ADMIN</SortTh>
                <SortTh field="tenant">TENANT</SortTh>
                <th>ROLE</th>
                <th>STATUS</th>
                <SortTh field="created_at">CREATED</SortTh>
                <th style={{ textAlign:'right', paddingRight:24 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
                  <Loader2 size={20} style={{ animation:'spin 1s linear infinite', display:'inline-block' }} />
                </td></tr>
              ) : currentRecords.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
                  {search || statusFilter ? 'No admins match your search.' : 'No admins found.'}
                </td></tr>
              ) : currentRecords.map((a, i) => (
                <tr key={a.id} className="animate-in" style={{ animationDelay:`${i * 0.03}s` }}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, background:getAvatarColor(a.name || a.email), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'white' }}>
                        {getInitials(a.name || a.email)}
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14, color:'#000' }}>{a.name || '—'}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)' }}>{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:99, fontSize:12, fontWeight:600, background:'var(--primary-light)', color:'var(--primary)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {a.tenant_name || '—'}
                    </span>
                  </td>
                  <td><span style={{ padding:'2px 8px', borderRadius:99, fontSize:12, fontWeight:600, background:'#F3E8FF', color:'#7C3AED' }}>{a.role}</span></td>
                  <td>
                    {a.is_pending
                      ? <StatusBadge status="Pending" />
                      : <StatusBadge status={a.is_active ? 'Active' : 'Inactive'} />
                    }
                  </td>
                  <td style={{ color:'var(--text-secondary)', fontSize:13.5 }}>{formatDate(a.created_at)}</td>
                  <td style={{ textAlign:'right', paddingRight:16 }} onClick={e => e.stopPropagation()}>
                    <div style={{ display:'flex', gap:4, alignItems:'center', justifyContent:'flex-end' }}>
                      <button
                        type="button"
                        title="Edit admin"
                        onClick={() => setEditingAdmin(a)}
                        style={{ padding:6, border:'none', background:'none', cursor:'pointer', color:'var(--text-muted)', transition:'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        title="Delete admin"
                        onClick={() => setDeletingAdmin(a)}
                        style={{ padding:6, border:'none', background:'none', cursor:'pointer', color:'var(--text-muted)', transition:'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={16} />
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
          <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border-light)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface)' }}>
            <span style={{ fontSize:13, color:'var(--text-secondary)' }}>
              Showing <strong>{(currentPage-1)*recordsPerPage+1}</strong> to <strong>{Math.min(currentPage*recordsPerPage, sortedAdmins.length)}</strong> of <strong>{sortedAdmins.length}</strong>
            </span>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1} style={{ padding:'6px 12px', borderRadius:6, border:'1px solid var(--border)', background:'white', cursor:currentPage===1?'not-allowed':'pointer', opacity:currentPage===1?0.5:1, display:'flex', alignItems:'center', gap:4, fontSize:13 }}>
                <ChevronLeft size={16} /> Previous
              </button>
              <div style={{ display:'flex', gap:4 }}>
                {Array.from({ length:totalPages }, (_,i) => i+1).map(pg => (
                  <button key={pg} onClick={() => setCurrentPage(pg)} style={{ width:32, height:32, borderRadius:6, border:'none', fontSize:13, fontWeight:currentPage===pg?600:400, background:currentPage===pg?'var(--primary)':'transparent', color:currentPage===pg?'white':'var(--text-primary)', cursor:'pointer' }}>{pg}</button>
                ))}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage===totalPages} style={{ padding:'6px 12px', borderRadius:6, border:'1px solid var(--border)', background:'white', cursor:currentPage===totalPages?'not-allowed':'pointer', opacity:currentPage===totalPages?0.5:1, display:'flex', alignItems:'center', gap:4, fontSize:13 }}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {!loading && totalPages <= 1 && (
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', fontSize:13, color:'var(--text-secondary)' }}>
            Showing {sortedAdmins.length} of {admins.length} admins
          </div>
        )}
      </div>

      <AddAdminModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleAddAdmin} />
    </div>
  );
}