import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Building2, ChevronDown, RefreshCw, Loader2, Edit2, Trash2 } from 'lucide-react';
import AddTenantModal from '../../components/superadmin/AddTenantModal';
import { superAdminService } from '../../services/superAdminService';

export default function SuperAdminTenants() {
  const [tenants, setTenants]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal]       = useState(false);

  const fetchTenants = useCallback(async (signal) => {
    setLoading(true); setError('');
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

  const filtered = tenants.filter(t => {
    const status = t.is_active ? 'Active' : 'Inactive';
    if (statusFilter && status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q);
    }
    return true;
  });

  const handleAddTenant = (result) => {
    const t = result.tenant ?? result;
    setTenants(prev => [t, ...prev]);
    setShowModal(false);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const hasActive = search || statusFilter;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
     {/* Header */}
<div className="page-header">
 <div className="page-header-left">
  <div className="breadcrumb">
    <span onClick={() => navigate('/superadmin/dashboard')} style={{ cursor:'pointer' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>Dashboard</span>
    <ChevronRight size={13} />
    <span style={{ color:'var(--text-secondary)' }}>Tenants</span>
  </div>
  <h1>Tenants</h1>
  <p>Manage all organizations on the platform</p>
</div>
</div>

      {/* Filter toolbar */}
      <div className="filter-toolbar">
        <div className="filter-search-row">
          <Search size={16} className="filter-search-icon" />
          <input
            className="filter-search-input"
            placeholder="Search by name or slug…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-dropdowns-row">
          <div className="filter-select-wrap">
            <select className={`filter-select${statusFilter ? ' active' : ''}`} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Status: All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown size={13} className="filter-chevron" />
          </div>
          <button
            onClick={() => fetchTenants()}
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
        <div className="alert-error">
          {error}
          <button className="alert-retry-btn" onClick={() => fetchTenants()}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
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
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>{search || statusFilter ? 'No tenants match your search.' : 'No tenants found.'}</td></tr>
              ) : filtered.map((t, i) => (
                <tr key={t.id} className="animate-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Building2 size={17} color="white" /></div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#000' }}>{t.name}</div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'monospace' }}>{t.slug}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: t.is_active ? '#ECFDF5' : '#FEF2F2', color: t.is_active ? '#059669' : '#B91C1C', border: `1px solid ${t.is_active ? '#A7F3D0' : '#FCA5A5'}` }}>
                      {t.is_active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />}
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{formatDate(t.created_at)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="row-actions">
                      <button className="icon-action-btn edit" type="button" title="Edit tenant (coming soon)" aria-label="Edit tenant" disabled>
                        <Edit2 size={14} />
                      </button>
                      <button className="icon-action-btn delete" type="button" title="Delete tenant (coming soon)" aria-label="Delete tenant" disabled>
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
          {loading ? 'Loading…' : `Showing ${filtered.length} of ${tenants.length} tenants`}
        </div>
      </div>

      <AddTenantModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleAddTenant} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}