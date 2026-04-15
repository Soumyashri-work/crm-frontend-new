import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, ChevronDown, RefreshCw, Loader2, Edit2, Trash2 } from 'lucide-react';
import { getInitials, getAvatarColor } from '../../utils/helpers';
import AddAdminModal from '../../components/superadmin/AddAdminModal';
import { superAdminService } from '../../services/superAdminService';

export default function SuperAdminAdmins() {
  const [admins, setAdmins]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal]       = useState(false);

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

  const filtered = admins.filter(a => {
    const status = a.is_pending ? 'Pending' : (a.is_active ? 'Active' : 'Inactive');
    if (statusFilter && status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.email.toLowerCase().includes(q) || (a.name && a.name.toLowerCase().includes(q)) || (a.tenant_name && a.tenant_name.toLowerCase().includes(q));
    }
    return true;
  });

  const handleAddAdmin = (result) => {
    setAdmins(prev => [{
      id: Date.now(), email: result.admin_email, name: result.admin_name || result.admin_email,
      role: 'admin', tenant_id: result.tenant?.id ?? '', tenant_name: result.tenant?.name ?? '—',
      is_active: false, is_pending: true, created_at: new Date().toISOString(),
    }, ...prev]);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const hasActive = search || statusFilter;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>
            <span>Dashboard</span><span style={{ margin: '0 5px' }}>›</span>
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
        {/* Search */}
        <div className="filter-search-row">
          <Search size={16} className="filter-search-icon" />
          <input
            className="filter-search-input"
            placeholder="Search by name, email or tenant…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Dropdowns */}
        <div className="filter-dropdowns-row">
          <div className="filter-select-wrap">
            <select className={`filter-select${statusFilter ? ' active' : ''}`} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Status: All</option>
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

          {hasActive && <button className="filter-clear-btn" onClick={() => { setSearch(''); setStatusFilter(''); }}>Clear Filters</button>}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#B91C1C', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => fetchAdmins()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C', fontSize: 13, fontFamily: 'inherit', textDecoration: 'underline' }}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
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
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>{search || statusFilter ? 'No admins match your search.' : 'No admins found.'}</td></tr>
              ) : filtered.map((a, i) => (
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
                        title="Edit admin (coming soon)"
                        aria-label="Edit admin"
                        disabled
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
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)' }}>
          {loading ? 'Loading…' : `Showing ${filtered.length} of ${admins.length} admins`}
        </div>
      </div>

      <AddAdminModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleAddAdmin} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
