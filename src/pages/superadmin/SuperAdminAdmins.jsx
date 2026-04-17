/**
 * src/pages/superadmin/SuperAdminAdmins.jsx — REFACTORED (PHASE 6)
 *
 * Uses DataTable component for search, sort, pagination
 * Maintains edit/delete functionality
 * Pagination logic now internal to DataTable component
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Shield, User, Mail, Loader2 } from 'lucide-react';
import { DataTable } from '../../components/DataTable';
import AddAdminModal from '../../components/superadmin/AddAdminModal';
import { superAdminService } from '../../services/superAdminService';
import { PAGE_SIZE } from '../../constants/pagination';
import { getInitials, getAvatarColor } from '../../utils/helpers';

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
    display: 'flex',
    alignItems: 'center',
    gap: 7,
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

// ─── Edit Admin Modal ────────────────────────────────────────────────
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

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required.';
    if (!form.last_name.trim()) e.last_name = 'Last name is required.';
    if (!form.admin_email.trim()) e.admin_email = 'Admin email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.admin_email))
      e.admin_email = 'Enter a valid email.';
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
  };

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  return (
    <div style={ms.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={ms.modal} role="dialog" aria-modal="true">
        <div style={ms.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={ms.iconBox}>
              <Shield size={18} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Edit Admin</h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
                Update admin details
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={ms.label}>
                  First Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    style={{
                      ...ms.input,
                      paddingLeft: 36,
                      borderColor: errors.first_name ? 'var(--danger)' : undefined,
                    }}
                    placeholder="e.g. John"
                    value={form.first_name}
                    onChange={(e) => updateField('first_name', e.target.value)}
                    autoFocus
                  />
                </div>
                {errors.first_name && <p style={ms.fieldError}>{errors.first_name}</p>}
              </div>

              <div>
                <label style={ms.label}>
                  Last Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    style={{
                      ...ms.input,
                      paddingLeft: 36,
                      borderColor: errors.last_name ? 'var(--danger)' : undefined,
                    }}
                    placeholder="e.g. Anderson"
                    value={form.last_name}
                    onChange={(e) => updateField('last_name', e.target.value)}
                  />
                </div>
                {errors.last_name && <p style={ms.fieldError}>{errors.last_name}</p>}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={ms.label}>
                Admin Email <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  style={{
                    ...ms.input,
                    paddingLeft: 36,
                    borderColor: errors.admin_email ? 'var(--danger)' : undefined,
                  }}
                  placeholder="admin@company.com"
                  value={form.admin_email}
                  onChange={(e) => updateField('admin_email', e.target.value)}
                />
              </div>
              {errors.admin_email && <p style={ms.fieldError}>{errors.admin_email}</p>}
            </div>
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
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" style={ms.submitBtn} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ────────────────────────────────────────────
function DeleteConfirmModal({ admin, onClose, onConfirm, isLoading }) {
  return (
    <div style={ms.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={ms.modal} role="dialog" aria-modal="true">
        <div style={ms.header}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
              Delete {admin?.name}?
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
            This admin account will be permanently deleted from the system.
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
export default function SuperAdminAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [deletingAdmin, setDeletingAdmin] = useState(null);

  // ─── Fetch admins ───────────────────────────────────────────────────
  const fetchAdmins = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const data = await superAdminService.getAdmins();
      if (signal?.aborted) return;
      setAdmins(Array.isArray(data) ? data : data?.items ?? []);
    } catch (err) {
      if (!signal?.aborted)
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

  // ─── Filter & sort ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return admins.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        return (
          a.email?.toLowerCase().includes(q) ||
          a.name?.toLowerCase().includes(q) ||
          a.tenant_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [admins, search]);

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

  const handleAddAdmin = () => {
    fetchAdmins(new AbortController().signal);
    setShowAddModal(false);
  };

  const handleSaveEdit = async (updated) => {
    try {
      await superAdminService.updateAdmin(updated.id, {
        name: updated.name,
        email: updated.email,
        first_name: updated.first_name,
        last_name: updated.last_name,
      });
      setAdmins((prev) =>
        prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
      );
      setEditingAdmin(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAdmin) return;
    try {
      await superAdminService.deleteAdmin(deletingAdmin.id);
      setAdmins((prev) => prev.filter((a) => a.id !== deletingAdmin.id));
      setDeletingAdmin(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // ─── Columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      label: 'Admin Name',
      sortable: true,
      width: '30%',
      render: (value, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: getAvatarColor(row.name),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {getInitials(row.name)}
          </div>
          <div>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
              {row.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {row.tenant_name || '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {value}
        </div>
      ),
    },
    {
      key: 'is_pending',
      label: 'Status',
      sortable: false,
      render: (value, row) => {
        const status = row.is_pending ? 'Pending' : row.is_active ? 'Active' : 'Inactive';
        const statusStyle = {
          Pending: { bg: '#FEF3C7', color: '#92400E' },
          Active: { bg: '#ECFDF5', color: '#065F46' },
          Inactive: { bg: '#F3F4F6', color: '#4B5563' },
        }[status];

        return (
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              background: statusStyle.bg,
              color: statusStyle.color,
              fontSize: 12,
              fontWeight: 600,
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
      sortable: false,
      render: (value) => {
        if (!value) return '—';
        return new Date(value).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      },
    },
    {
      key: 'id',
      label: 'Actions',
      width: 100,
      align: 'center',
      render: (value, row) => (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={() => setEditingAdmin(row)}
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
            title="Edit admin"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => setDeletingAdmin(row)}
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
            title="Delete admin"
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
          <h1>Admins</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Manage administrators across all tenants
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
          <Plus size={14} /> Add Admin
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
        onRetry={() => fetchAdmins(new AbortController().signal)}
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
        searchPlaceholder="Search by name, email or tenant…"
        emptyMessage={
          search ? 'No admins match your search.' : 'No admins found.'
        }
      />

      {/* Modals */}
      {showAddModal && (
        <AddAdminModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddAdmin}
        />
      )}

      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deletingAdmin && (
        <DeleteConfirmModal
          admin={deletingAdmin}
          onClose={() => setDeletingAdmin(null)}
          onConfirm={handleDeleteConfirm}
          isLoading={false}
        />
      )}
    </div>
  );
}