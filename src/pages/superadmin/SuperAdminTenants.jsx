import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom'; // Added Link for navigation
import {
  Search,
  Plus,
  Building2,
  ChevronDown,
  MoreVertical,
  RefreshCw,
  Loader2,
  X,
  Mail,
  Globe,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AddTenantModal from '../../components/superadmin/AddTenantModal';
import { superAdminService } from '../../services/superAdminService';

// --- Edit Tenant Modal Component ---
function EditTenantModal({ tenant, onClose, onSave, allSystems = [] }) {
  const initialSelected = (tenant?.source_systems || []).map(s =>
    typeof s === 'string' ? s : (s.system_name || '')
  ).filter(Boolean);

  const [form, setForm] = useState({
    name: tenant?.name || '',
    email: tenant?.email || tenant?.contact_email || ''
  });
  const [selectedSystems, setSelectedSystems] = useState(initialSelected);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Tenant name is required.';
    if (!form.email.trim()) e.email = 'Contact email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (selectedSystems.length === 0) e.systems = 'Select at least one CRM system.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setApiError('');
    try {
      await onSave({
        ...tenant,
        name: form.name.trim(),
        email: form.email.trim(),
        contact_email: form.email.trim(),
        source_systems: selectedSystems.map(s => ({ system_name: s })),
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

  function toggleSystem(sys) {
    setSelectedSystems(prev =>
      prev.includes(sys) ? prev.filter(s => s !== sys) : [...prev, sys]
    );
    if (errors.systems) setErrors(e => ({ ...e, systems: '' }));
  }

  const systemOptions = allSystems.map(s => s.system_name || s);

  return (
    <div style={ms.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={ms.modal} role="dialog" aria-modal="true">
        <div style={ms.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={ms.iconBox}><Building2 size={18} color="white" /></div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Edit Tenant</h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>Update organization details</p>
            </div>
          </div>
          <button onClick={onClose} style={ms.closeBtn} aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ padding: '24px 24px 0' }}>
            {apiError && <div style={ms.errorBanner} role="alert">{apiError}</div>}

            <div style={{ marginBottom: 18 }}>
              <label style={ms.label}>Tenant Name <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Building2 size={15} style={ms.inputIcon} />
                <input
                  style={{ ...ms.input, paddingLeft: 36, borderColor: errors.name ? 'var(--danger)' : undefined }}
                  placeholder="e.g. Global Industries Corp"
                  value={form.name}
                  onChange={e => field('name', e.target.value)}
                  autoFocus
                />
              </div>
              {errors.name && <p role="alert" style={ms.fieldError}>{errors.name}</p>}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={ms.label}>Contact Email <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={ms.inputIcon} />
                <input
                  type="email"
                  style={{ ...ms.input, paddingLeft: 36, borderColor: errors.email ? 'var(--danger)' : undefined }}
                  placeholder="admin@company.com"
                  value={form.email}
                  onChange={e => field('email', e.target.value)}
                />
              </div>
              {errors.email && <p role="alert" style={ms.fieldError}>{errors.email}</p>}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={ms.label}>Source / CRM Systems <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{
                border: `1px solid ${errors.systems ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                overflow: 'hidden',
              }}>
                {systemOptions.map((sys, idx) => {
                  const checked = selectedSystems.includes(sys);
                  return (
                    <label
                      key={sys}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        cursor: 'pointer',
                        borderTop: idx > 0 ? '1px solid var(--border-light)' : 'none',
                        background: checked ? 'var(--primary-subtle, #EEF2FF)' : 'transparent',
                        transition: '0.15s',
                        userSelect: 'none',
                        position: 'relative',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSystem(sys)}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                          border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                          background: checked ? 'var(--primary)' : 'var(--surface)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.15s, border-color 0.15s',
                        }}
                        aria-hidden="true"
                      >
                        {checked && <Check size={11} color="white" strokeWidth={3} />}
                      </span>
                      <Globe size={14} style={{ color: checked ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontSize: 13.5, color: 'var(--text-primary)', fontWeight: checked ? 600 : 400 }}>
                        {sys}
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.systems && <p role="alert" style={ms.fieldError}>{errors.systems}</p>}
            </div>
          </div>

          <div style={ms.footer}>
            <button type="button" onClick={onClose} style={ms.cancelBtn} disabled={submitting}>Cancel</button>
            <button type="submit" style={ms.submitBtn} disabled={submitting}>
              {submitting
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                : 'Save Changes'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Action Menu Component with Collision Detection ---
function ActionMenu({ anchorEl, onEdit, onClose }) {
  const [coords, setCoords] = useState({ top: 0, right: 0, openUp: false });

  useEffect(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const menuHeight = 85;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < (menuHeight + 20);

    setCoords({
      top: openUp ? rect.top - menuHeight - 8 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
      openUp
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
          onClick={e => { e.preventDefault(); onClose(); }}
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

// --- Main Page Component ---
export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState([]);
  const [allSystems, setAllSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    superAdminService.getSourceSystems()
      .then(data => setAllSystems(Array.isArray(data) ? data : []))
      .catch(() => setAllSystems([]));
  }, []);

  const fetchTenants = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const data = await superAdminService.getTenants();
      if (signal?.aborted) return;
      setTenants(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (err) {
      if (signal?.aborted) return;
      setError('Could not load tenants. Please try again.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTenants(controller.signal);
    return () => controller.abort();
  }, [fetchTenants]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filtered = tenants.filter(t => {
    const status = t.is_active ? 'Active' : 'Inactive';
    if (statusFilter && status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        (t.email || t.contact_email || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filtered.length / recordsPerPage);
  const currentRecords = filtered.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const handleAddTenant = (result) => {
    const t = {
      ...(result.tenant ?? result),
      source_systems: result.source_systems ?? []
    };
    setTenants(prev => [t, ...prev]);
    setShowModal(false);
  };

  const handleSaveEdit = (updated) => {
    setTenants(prev => prev.map(t =>
      t.id === updated.id
        ? { ...t, name: updated.name, email: updated.email, contact_email: updated.email, source_systems: updated.source_systems }
        : t
    ));
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const hasActiveFilters = !!statusFilter;

  const clearFilters = () => {
    setStatusFilter('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 100 }}>
      {/* GLOBAL STYLES FOR SPIN AND BREADCRUMB */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .breadcrumb-link {
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .breadcrumb-link:hover {
          color: var(--primary);
          text-decoration: underline;
        }
      `}</style>

      {editingTenant && (
        <EditTenantModal
          tenant={editingTenant}
          onClose={() => setEditingTenant(null)}
          onSave={handleSaveEdit}
          allSystems={allSystems}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {/* LINKED BREADCRUMB */}
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            <Link to="/superadmin/dashboard" className="breadcrumb-link">
              Dashboard
            </Link>
            <span style={{ margin: '0 6px' }}>›</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Tenants</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Tenants</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>Manage all tenant organizations</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', fontSize: 14 }}>
          <Plus size={16} /> Add Tenant
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        {/* Search Row */}
        <div className="filter-search-row">
          <Search size={15} className="filter-search-icon" />
          <input
            className="filter-search-input"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Dropdowns Row */}
        <div className="filter-dropdowns-row">
          {/* Status Filter */}
          <div className="filter-select-wrap">
            <select
              className={`filter-select${statusFilter ? ' active' : ''}`}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">Status: All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown size={13} className="filter-chevron" />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button className="filter-clear-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => fetchTenants()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              border: '1.5px solid var(--border-dark)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              fontSize: 12.5,
              fontWeight: 500,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#DC2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => fetchTenants()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 13, fontFamily: 'inherit', textDecoration: 'underline' }}>Retry</button>
        </div>
      )}

      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="table-wrap">
          <table style={{ overflow: 'visible' }}>
            <thead>
              <tr>
                <th>TENANT</th>
                <th>CONTACT EMAIL</th>
                <th>STATUS</th>
                <th>CREATED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} /></td></tr>
              ) : currentRecords.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  {search || statusFilter ? 'No tenants match your filters.' : 'No tenants found.'}
                </td></tr>
              ) : currentRecords.map((t, i) => (
                <tr key={t.id} className="animate-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={17} color="white" />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                    </div>
                  </td>
                  <td>{t.email || t.contact_email || '—'}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: t.is_active ? '#ECFDF5' : '#FEF2F2', color: t.is_active ? '#059669' : '#DC2626' }}>
                      {t.is_active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />}
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{formatDate(t.created_at)}</td>
                  <td>
                    <button className="btn btn-ghost" style={{ padding: '5px 8px' }}
                      onClick={(e) => { setOpenMenuId(openMenuId === t.id ? null : t.id); setMenuAnchor(e.currentTarget); }}>
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === t.id && (
                      <ActionMenu
                        anchorEl={menuAnchor}
                        onEdit={() => setEditingTenant(t)}
                        onClose={() => setOpenMenuId(null)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Pagination Navigation --- */}
        {!loading && totalPages > 1 && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)'
          }}>
            <span style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              fontWeight: '400 !important'
            }}>
              Showing {(currentPage - 1) * recordsPerPage + 1} to {Math.min(currentPage * recordsPerPage, filtered.length)} of {filtered.length} tenants
            </span>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 13
                }}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 13,
                      fontWeight: currentPage === page ? 600 : 400,
                      background: currentPage === page ? 'var(--primary)' : 'transparent',
                      color: currentPage === page ? 'white' : 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 13
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Footer count when single page */}
        {!loading && totalPages <= 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
            Showing {filtered.length} of {tenants.length} tenants
          </div>
        )}
      </div>

      <AddTenantModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddTenant}
      />
    </div>
  );
}

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
};
