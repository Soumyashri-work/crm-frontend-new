/**
 * src/pages/superadmin/SuperAdminTenants.jsx — REFACTORED (PHASE 6)
 *
 * Uses DataTable component for search, sort, filter, pagination
 * Maintains edit/delete functionality
 * Pagination logic now internal to DataTable component
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Building2, Plus, Edit2, Trash2, X } from 'lucide-react';
import { DataTable } from '../../components/DataTable';
import AddTenantModal from '../../components/superadmin/AddTenantModal';
import { superAdminService } from '../../services/superAdminService';
import { PAGE_SIZE } from '../../constants/pagination';

// ─── Modal styles ────────────────────────────────────────────────────
const ms = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    width: '100%',
    maxWidth: 480,
    border: '1px solid var(--border)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid var(--border)',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--surface)',
    fontSize: 13.5,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 },
  fieldError: { fontSize: 11.5, color: 'var(--danger)', marginTop: 4 },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    padding: '16px 24px',
    borderTop: '1px solid var(--border)',
  },
  submitBtn: {
    padding: '9px 20px',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--primary)',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'inherit',
  },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' },
  errorBanner: {
    marginBottom: 16,
    padding: '10px 14px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#DC2626',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
  },
};

// ─── Edit Tenant Modal ───────────────────────────────────────────────
function EditTenantModal({ tenant, onClose, onSave, allSystems = [] }) {
  const [form, setForm] = useState({
    name: tenant?.name || '',
    email: tenant?.email || tenant?.contact_email || '',
  });
  const [selectedSystems, setSelectedSystems] = useState(
    (tenant?.source_systems || [])
      .map((s) => (typeof s === 'string' ? s : s.system_name || ''))
      .filter(Boolean)
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Tenant name is required.';
    if (!form.email.trim()) e.email = 'Contact email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (selectedSystems.length === 0) e.systems = 'Select at least one CRM system.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setApiError('');
    try {
      await onSave({
        ...tenant,
        name: form.name.trim(),
        email: form.email.trim(),
        contact_email: form.email.trim(),
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
        <div style={ms.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={ms.iconBox}>
              <Building2 size={18} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Edit Tenant</h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
                Update organization details
              </p>
            </div>
          </div>
          <button onClick={onClose} style={ms.closeBtn} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ padding: '24px 24px 0' }}>
            {apiError && <div style={ms.errorBanner} role="alert">{apiError}</div>}

            <div style={{ marginBottom: 18 }}>
              <label style={ms.label}>
                Tenant Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                style={ms.input}
                placeholder="e.g. Global Industries Corp"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }));
                  if (errors.name) setErrors((e) => ({ ...e, name: '' }));
                }}
                autoFocus
              />
              {errors.name && <p style={ms.fieldError}>{errors.name}</p>}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={ms.label}>
                Contact Email <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="email"
                style={ms.input}
                placeholder="admin@company.com"
                value={form.email}
                onChange={(e) => {
                  setForm((f) => ({ ...f, email: e.target.value }));
                  if (errors.email) setErrors((e) => ({ ...e, email: '' }));
                }}
              />
              {errors.email && <p style={ms.fieldError}>{errors.email}</p>}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={ms.label}>
                Source / CRM Systems <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div
                style={{
                  border: errors.systems ? '1px solid var(--danger)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface)',
                  overflow: 'hidden',
                }}
              >
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
                        background: checked ? 'var(--primary-light)' : 'transparent',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSystem(sys)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>
                        {sys}
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.systems && <p style={ms.fieldError}>{errors.systems}</p>}
            </div>
          </div>

          <div style={ms.footer}>
            <button type="button" onClick={onClose} style={{ ...ms.submitBtn, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" style={ms.submitBtn} disabled={submitting}>
              Save Changes
            </button>
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
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
              Delete {tenant?.name}?
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              This action cannot be undone.
            </p>
          </div>
          <button onClick={onClose} style={ms.closeBtn}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 0 }}>
            All data associated with this tenant will be permanently deleted.
          </p>
        </div>

        <div style={ms.footer}>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...ms.submitBtn,
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{ ...ms.submitBtn, background: 'var(--danger)' }}
            disabled={isLoading}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────
export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState([]);
  const [allSystems, setAllSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [deletingTenant, setDeletingTenant] = useState(null);

  // ─── Fetch systems on mount ─────────────────────────────────────────
  useEffect(() => {
    superAdminService
      .getSourceSystems()
      .then((data) => setAllSystems(Array.isArray(data) ? data : []))
      .catch(() => setAllSystems([]));
  }, []);

  // ─── Fetch tenants ──────────────────────────────────────────────────
  const fetchTenants = useCallback(async (signal) => {
    setLoading(true);
    setError('');
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

  // ─── Filter & sort ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      if (search) {
        const q = search.toLowerCase();
        return (
          t.name?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tenants, search]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortField] ?? '').toLowerCase();
      const bv = String(b[sortField] ?? '').toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  // ─── Handlers ───────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleAddTenant = (result) => {
    fetchTenants(new AbortController().signal);
    setShowAddModal(false);
  };

  const handleSaveEdit = async (updated) => {
    try {
      await superAdminService.updateTenant(updated.id, {
        name: updated.name,
        email: updated.email,
        source_systems: updated.source_systems,
      });
      setTenants((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );
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

  // ─── Format date helper ─────────────────────────────────────────────
  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ─── Columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      label: 'Tenant',
      sortable: true,
      width: '25%',
      render: (value, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 size={17} color="white" />
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
            {value}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Contact Email',
      sortable: true,
      width: '30%',
      render: (value, row) => (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {value || row.contact_email || '—'}
        </div>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      width: '15%',
      render: (value, row) => {
        const isActive = row.is_active ?? true;
        const status = isActive ? 'Active' : 'Inactive';
        const bgColor = isActive ? '#DCFCE7' : '#F3F4F6';
        const textColor = isActive ? '#166534' : '#6B7280';
        return (
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12.5,
              fontWeight: 600,
              background: bgColor,
              color: textColor,
            }}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      width: '15%',
      render: (value, row) => (
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {formatDate(value || row.created_at)}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      width: 60,
      align: 'center',
      render: (value, row) => (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={() => setEditingTenant(row)}
            title="Edit tenant"
            style={{
              padding: 6,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => setDeletingTenant(row)}
            title="Delete tenant"
            style={{
              padding: 6,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1>Tenants</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Manage all organizations on the platform
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 600,
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={14} /> Add Tenant
        </button>
      </div>

      {/* DataTable — PHASE 6: Unified pagination now internal to DataTable */}
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
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filters={{}}
        onFilterChange={() => {}}
        filterOptions={[]}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
        searchPlaceholder="Search by name or email…"
        emptyMessage={
          search ? 'No tenants match your search.' : 'No tenants found.'
        }
      />

      {/* Modals */}
      {showAddModal && (
        <AddTenantModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddTenant}
          allSystems={allSystems}
        />
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