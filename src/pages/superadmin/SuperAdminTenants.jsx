/**
 * src/pages/superadmin/SuperAdminTenants.jsx
 *
 * Fixes:
 *  ✅ EditTenantModal: "Originally selected" dot/legend REMOVED
 *  ✅ EditTenantModal: pre-selected CRMs seeded from tenant.source_systems,
 *     shown checked + blue-highlighted (identical to Add Tenant modal)
 *  ✅ Status column: sortable:false — no sort arrows
 *  ✅ Contact Email column: sortable:true + comparator reads email||contact_email (functional)
 *  ✅ DELETE FUNCTIONALITY: Trash2 button now opens ConfirmDeleteModal
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Edit2, Trash2, X, ChevronRight } from 'lucide-react';
import { DataTable } from '../../components/DataTable';
import AddTenantModal from '../../components/superadmin/AddTenantModal';
import { superAdminService } from '../../services/superAdminService';
import { PAGE_SIZE } from '../../constants/pagination';
import { getInitials, getAvatarColor } from '../../utils/helpers';

// ─── Shared status badge ─────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    Active:   { bg: '#ECFDF5', color: '#065F46', dot: '#16a34a' },
    Inactive: { bg: '#F3F4F6', color: '#4B5563', dot: '#9CA3AF' },
    Pending:  { bg: '#FEF3C7', color: '#92400E', dot: '#D97706' },
  };
  const s = map[status] || map.Inactive;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:99, fontSize:12, fontWeight:600, background:s.bg, color:s.color, whiteSpace:'nowrap' }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:s.dot, flexShrink:0, display:'inline-block' }} />
      {status}
    </span>
  );
}

// ─── Tenant Avatar ───────────────────────────────────────────────────
export function TenantAvatar({ name, size = 36 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:getAvatarColor(name||''), display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'white', fontSize:size*0.33, fontWeight:700 }}>
      {getInitials(name || '?')}
    </div>
  );
}

// ─── Modal shared styles ─────────────────────────────────────────────
const ms = {
  overlay: { position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modal:   { background:'var(--surface)', borderRadius:'var(--radius)', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', width:'100%', maxWidth:480, border:'1px solid var(--border)' },
  header:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid var(--border)' },
  iconBox: { width:38, height:38, borderRadius:'50%', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center' },
  input:   { width:'100%', padding:'9px 12px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--surface)', fontSize:13.5, outline:'none', fontFamily:'inherit', boxSizing:'border-box' },
  label:   { display:'block', fontSize:13, fontWeight:600, marginBottom:6 },
  fieldError: { fontSize:11.5, color:'var(--danger)', marginTop:4 },
  footer:  { display:'flex', justifyContent:'flex-end', gap:10, padding:'16px 24px', borderTop:'1px solid var(--border)' },
  submitBtn: { padding:'9px 20px', borderRadius:'var(--radius-sm)', background:'var(--primary)', color:'white', fontWeight:600, cursor:'pointer', border:'none', fontFamily:'inherit' },
  closeBtn:  { background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' },
  errorBanner: { marginBottom:16, padding:'10px 14px', background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', borderRadius:'var(--radius-sm)', fontSize:13 },
};

// ─── Edit Tenant Modal ───────────────────────────────────────────────
function EditTenantModal({ tenant, onClose, onSave, allSystems = [] }) {
  const [form, setForm] = useState({
    name:  tenant?.name || '',
    email: tenant?.email || tenant?.contact_email || '',
  });

  // Seed the checkbox state from whatever was persisted on this tenant
  const [selectedSystems, setSelectedSystems] = useState(() =>
    (tenant?.source_systems || [])
      .map((s) => (typeof s === 'string' ? s : s.system_name || ''))
      .filter(Boolean)
  );

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState({});
  const [apiError, setApiError]     = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Tenant name is required.';
    if (!form.email.trim()) e.email = 'Contact email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (selectedSystems.length === 0) e.systems = 'Select at least one CRM system.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setApiError('');
    try {
      await onSave({
        ...tenant,
        name:           form.name.trim(),
        email:          form.email.trim(),
        contact_email:  form.email.trim(),
        source_systems: selectedSystems.map((s) => ({ system_name: s })),
      });
      onClose();
    } catch (err) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSystem = (sys) => {
    setSelectedSystems((prev) =>
      prev.includes(sys) ? prev.filter((s) => s !== sys) : [...prev, sys]
    );
    if (errors.systems) setErrors((e) => ({ ...e, systems: '' }));
  };

  const systemOptions = allSystems.map((s) => s.system_name || s);

  return (
    <div style={ms.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={ms.modal} role="dialog" aria-modal="true">
        {/* Header */}
        <div style={ms.header}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={ms.iconBox}><Building2 size={18} color="white" /></div>
            <div>
              <h2 style={{ fontSize:17, fontWeight:700, margin:0 }}>Edit Tenant</h2>
              <p style={{ fontSize:12.5, color:'var(--text-muted)', margin:0 }}>Update organization details</p>
            </div>
          </div>
          <button onClick={onClose} style={ms.closeBtn} aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ padding:'24px 24px 0' }}>
            {apiError && <div style={ms.errorBanner} role="alert">{apiError}</div>}

            {/* Tenant Name */}
            <div style={{ marginBottom:18 }}>
              <label style={ms.label}>Tenant Name <span style={{ color:'var(--danger)' }}>*</span></label>
              <input
                style={ms.input}
                placeholder="e.g. Global Industries Corp"
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name:e.target.value })); if (errors.name) setErrors((er)=>({...er,name:''})); }}
                autoFocus
              />
              {errors.name && <p style={ms.fieldError}>{errors.name}</p>}
            </div>

            {/* Contact Email */}
            <div style={{ marginBottom:18 }}>
              <label style={ms.label}>Contact Email <span style={{ color:'var(--danger)' }}>*</span></label>
              <input
                type="email"
                style={ms.input}
                placeholder="admin@company.com"
                value={form.email}
                onChange={(e) => { setForm((f) => ({ ...f, email:e.target.value })); if (errors.email) setErrors((er)=>({...er,email:''})); }}
              />
              {errors.email && <p style={ms.fieldError}>{errors.email}</p>}
            </div>

            {/* CRM Systems — NO legend dot/line, pre-selected shown in blue */}
            <div style={{ marginBottom:18 }}>
              <label style={{ ...ms.label, marginBottom:6 }}>
                Source / CRM Systems <span style={{ color:'var(--danger)' }}>*</span>
              </label>
              <div style={{ border: errors.systems ? '1px solid var(--danger)' : '1px solid var(--border)', borderRadius:'var(--radius-sm)', background:'var(--surface)', overflow:'hidden' }}>
                {systemOptions.map((sys, idx) => {
                  const checked = selectedSystems.includes(sys);
                  return (
                    <label
                      key={sys}
                      style={{
                        display:'flex', alignItems:'center', gap:10, padding:'9px 12px', cursor:'pointer',
                        borderTop: idx > 0 ? '1px solid var(--border-light)' : 'none',
                        background: checked ? 'var(--primary-light)' : 'transparent',
                        userSelect:'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSystem(sys)}
                        style={{ cursor:'pointer', accentColor:'var(--primary)' }}
                      />
                      <span style={{ fontSize:13.5, color:'var(--text-primary)', flex:1 }}>{sys}</span>
                    </label>
                  );
                })}
              </div>
              {errors.systems && <p style={ms.fieldError}>{errors.systems}</p>}
            </div>
          </div>

          <div style={ms.footer}>
            <button type="button" onClick={onClose} style={{ ...ms.submitBtn, background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border)' }} disabled={submitting}>Cancel</button>
            <button type="submit" style={ms.submitBtn} disabled={submitting}>{submitting ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ────────────────────────────────────────────
function DeleteConfirmModal({ tenant, onClose, onConfirm, isLoading }) {
  return (
    <div style={ms.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={ms.modal} role="dialog" aria-modal="true">
        <div style={ms.header}>
          <div>
            <h2 style={{ fontSize:17, fontWeight:700, margin:0 }}>Delete {tenant?.name}?</h2>
            <p style={{ fontSize:12.5, color:'var(--text-muted)', margin:'4px 0 0' }}>This action cannot be undone.</p>
          </div>
          <button onClick={onClose} style={ms.closeBtn}><X size={18} /></button>
        </div>
        <div style={{ padding:'24px' }}>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:0 }}>All data associated with this tenant will be permanently deleted.</p>
        </div>
        <div style={ms.footer}>
          <button type="button" onClick={onClose} style={{ ...ms.submitBtn, background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border)' }} disabled={isLoading}>Cancel</button>
          <button type="button" onClick={onConfirm} style={{ ...ms.submitBtn, background:'var(--danger)' }} disabled={isLoading}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function SuperAdminTenants() {
  const navigate = useNavigate();
  const [tenants, setTenants]             = useState([]);
  const [allSystems, setAllSystems]       = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [sortField, setSortField]         = useState('');
  const [sortDir, setSortDir]             = useState('asc');
  const [page, setPage]                   = useState(1);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [deletingTenant, setDeletingTenant] = useState(null);

  useEffect(() => {
    superAdminService.getSourceSystems()
      .then((data) => setAllSystems(Array.isArray(data) ? data : []))
      .catch(() => setAllSystems([]));
  }, []);

  const fetchTenants = useCallback(async (signal) => {
    setLoading(true); setError('');
    try {
      const data = await superAdminService.getTenants();
      if (signal?.aborted) return;
      setTenants(Array.isArray(data) ? data : data?.items ?? []);
    } catch (err) {
      if (!signal?.aborted) setError('Could not load tenants. Please try again.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTenants(controller.signal);
    return () => controller.abort();
  }, [fetchTenants]);

  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      if (search) {
        const q = search.toLowerCase();
        if (!t.name?.toLowerCase().includes(q) && !t.email?.toLowerCase().includes(q) && !t.contact_email?.toLowerCase().includes(q)) return false;
      }
      if (statusFilter) {
        const tenantStatus = (t.is_active ?? true) ? 'active' : 'inactive';
        if (tenantStatus !== statusFilter) return false;
      }
      return true;
    });
  }, [tenants, search, statusFilter]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      // For email column, fall back to contact_email
      const av = sortField === 'email'
        ? String(a.email || a.contact_email || '').toLowerCase()
        : String(a[sortField] ?? '').toLowerCase();
      const bv = sortField === 'email'
        ? String(b.email || b.contact_email || '').toLowerCase()
        : String(b[sortField] ?? '').toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleAddTenant = () => {
    fetchTenants(new AbortController().signal);
    setShowAddModal(false);
  };

  const handleSaveEdit = async (updated) => {
    try {
      await superAdminService.updateTenant(updated.id, {
        name:           updated.name,
        email:          updated.email,
        source_systems: updated.source_systems,
      });
      setTenants((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
      setEditingTenant(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTenant) return;
    try {
      await superAdminService.deleteTenant(deletingTenant.id);
      setTenants((prev) => prev.filter((t) => t.id !== deletingTenant.id));
      setDeletingTenant(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  };

  // Status: sortable:false  |  Contact Email: sortable:true (functional)
  const columns = [
    {
      key: 'name',
      label: 'Tenant',
      sortable: true,
      width: '28%',
      render: (value, row) => (
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <TenantAvatar name={value} size={36} />
          <div>
            <div style={{ fontWeight:600, fontSize:14, color:'var(--text-primary)' }}>{value}</div>
            {row.slug && <div style={{ fontSize:12, color:'var(--text-muted)' }}>{row.slug}</div>}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Contact Email',
      sortable: true,        // ← functional: comparator handles email||contact_email
      width: '28%',
      render: (value, row) => (
        <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{value || row.contact_email || '—'}</div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: false,       // ← NO sort arrows on Status column
      width: '15%',
      render: (value, row) => <StatusBadge status={(row.is_active ?? true) ? 'Active' : 'Inactive'} />,
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      width: '15%',
      render: (value, row) => (
        <span style={{ fontSize:13, color:'var(--text-muted)' }}>{formatDate(value || row.created_at)}</span>
      ),
    },
   {
      key: 'id',
      label: 'Actions',
      width: 80,
      align: 'center',
      render: (value, row) => (
        <div style={{ display:'flex', gap:4, alignItems:'center', justifyContent:'center' }}>
          <button
            onClick={() => setEditingTenant(row)}
            title="Edit tenant"
            style={{ padding:6, border:'none', background:'none', cursor:'pointer', color:'var(--text-muted)', transition:'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => setDeletingTenant(row)}
            title="Delete tenant"
            style={{ padding:6, border:'none', background:'none', cursor:'pointer', color:'var(--text-muted)', transition:'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const filterOptions = [
    {
      key: 'status',
      label: 'All Status',
      options: [
        { value:'active',   label:'Active' },
        { value:'inactive', label:'Inactive' },
      ],
    },
  ];

  const hasActiveFilters = !!search || !!statusFilter;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Breadcrumb */}
      <nav style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>
        <span
          onClick={() => navigate('/superadmin/dashboard')}
          style={{ cursor:'pointer', color:'var(--text-muted)', fontWeight:500 }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          Dashboard
        </span>
        <ChevronRight size={14} />
        <span style={{ color:'var(--text-secondary)', fontWeight:500 }}>Tenants</span>
      </nav>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:0 }}>Tenants</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>Manage all organizations on the platform</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ padding:'9px 16px', fontSize:13, fontWeight:600, background:'var(--primary)', color:'white', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
        >
          <Plus size={14} /> Add Tenant
        </button>
      </div>

      <DataTable
        columns={columns}
        data={sorted}
        pageSize={PAGE_SIZE.SMALL}
        currentPage={page}
        onPageChange={setPage}
        loading={loading}
        error={error || null}
        onRetry={() => fetchTenants(new AbortController().signal)}
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        filters={{ status: statusFilter }}
        onFilterChange={(key, val) => { if (key === 'status') { setStatusFilter(val); setPage(1); } }}
        filterOptions={filterOptions}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
        searchPlaceholder="Search by name or email…"
        emptyMessage={hasActiveFilters ? 'No tenants match your filters.' : 'No tenants found.'}
      />

      {showAddModal && (
        <AddTenantModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddTenant} />
      )}

      {editingTenant && (
        <EditTenantModal
          tenant={editingTenant}
          onClose={() => setEditingTenant(null)}
          onSave={handleSaveEdit}
          allSystems={allSystems}
        />
      )}

      {deletingTenant && (
        <DeleteConfirmModal
          tenant={deletingTenant}
          onClose={() => setDeletingTenant(null)}
          onConfirm={handleDeleteConfirm}
          isLoading={false}
        />
      )}
    </div>
  );
}