import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Building2, ChevronDown, MoreVertical, RefreshCw, Loader2 } from 'lucide-react';
import AddTenantModal from '../../components/superadmin/AddTenantModal';
import { superAdminService } from '../../services/superAdminService';

export default function SuperAdminTenants() {
  const [tenants, setTenants]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal]       = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchTenants = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const data = await superAdminService.getTenants();
      if (signal?.aborted) return;
      setTenants(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (err) {
      if (signal?.aborted) return;
      console.error('Failed to load tenants:', err);
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

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = tenants.filter(t => {
    const status = t.is_active ? 'Active' : 'Inactive';
    if (statusFilter && status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── On new tenant created ─────────────────────────────────────────────────
  // API response shape: { tenant: { id, name, slug, is_active, created_at }, source_systems, message }
  const handleAddTenant = (result) => {
    const t = result.tenant ?? result; // handle both envelope and raw
    setTenants(prev => [t, ...prev]);
    setShowModal(false);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>Dashboard</span><span style={{ margin: '0 6px' }}>›</span>
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

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="form-input" style={{ paddingLeft: 36, width: '100%' }}
            placeholder="Search by name or slug…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ position: 'relative' }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ appearance: 'none', padding: '9px 36px 9px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', fontSize: 13.5, color: 'var(--text-primary)', cursor: 'pointer', outline: 'none', fontFamily: 'inherit', minWidth: 130 }}>
            <option value="">Status: All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
        </div>
        <button onClick={() => fetchTenants()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', fontSize: 13.5, cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#DC2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => fetchTenants()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 13, fontFamily: 'inherit', textDecoration: 'underline' }}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>TENANT</th>
                <th>SLUG</th>
                <th>STATUS</th>
                <th>CREATED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    {search || statusFilter ? 'No tenants match your search.' : 'No tenants found.'}
                  </td>
                </tr>
              ) : filtered.map((t, i) => (
                <tr key={t.id} className="animate-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={17} color="white" />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'monospace' }}>{t.slug}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                      background: t.is_active ? '#ECFDF5' : '#FEF2F2',
                      color:      t.is_active ? '#059669' : '#DC2626',
                    }}>
                      {t.is_active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />}
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{formatDate(t.created_at)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost" style={{ padding: '5px 8px' }} onClick={e => e.preventDefault()}>
                      <MoreVertical size={16} />
                    </button>
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

      <AddTenantModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddTenant}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}