import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Edit2, UserX, Search, ArrowUp, ArrowDown, ArrowUpDown,
  Send, X, XCircle, Clock3, AlertTriangle, CheckCircle2, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentService, agentKeys } from '../../services/agentService';
import { tenantService, tenantKeys } from '../../services/tenantService';
import {
  getInitials, getAvatarColor, getAgentStatusMeta, getAgentCrmSources, getAgentTicketsCount, getAgentActiveStatus, getAgentIsActive,
} from '../../utils/helpers';
import EditAgentModal from '../../components/EditAgentModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import CrmBadgesDisplay from '../../components/CrmBadgesDisplay';
import InviteAgentModal from '../../components/InviteAgentModal';

const PAGE_SIZE = 20;

export default function Agents() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [search,            setSearch]            = useState('');
  const [sortField,         setSortField]         = useState('');
  const [sortDir,           setSortDir]           = useState('asc');
  const [statusFilter,      setStatusFilter]      = useState('');
  const [sourceFilter,      setSourceFilter]      = useState('');
  const [page,              setPage]              = useState(1);
  const [selectedRows,      setSelectedRows]      = useState(new Set());
  const [banner,            setBanner]            = useState(null);
  const [editingAgent,      setEditingAgent]      = useState(null);
  const [deletingAgent,     setDeletingAgent]     = useState(null);
  const [inviteModalOpen,   setInviteModalOpen]   = useState(false);
  const [inviteTargetAgent, setInviteTargetAgent] = useState(null);

  const { data: sourceSystems = [], isLoading: isSourceLoading } = useQuery({
    queryKey: tenantKeys.sourceSystems(),
    queryFn:  () => tenantService.getSourceSystems(),
    staleTime: 5 * 60 * 1000,
  });

  const queryParams = { page, page_size: PAGE_SIZE, include_inactive: true, ...(sourceFilter ? { source: sourceFilter } : {}) };
  const useFilterEndpoint = !!sourceFilter;

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: useFilterEndpoint ? [...agentKeys.list(queryParams), 'filter'] : agentKeys.list(queryParams),
    queryFn:  () => useFilterEndpoint ? agentService.filter(queryParams) : agentService.getAll(queryParams),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const agents     = data?.items       ?? [];
  const pagination = { total: data?.total ?? 0, total_pages: data?.total_pages ?? 1 };

  const filtered = useMemo(() => agents.filter(a => {
    const meta = getAgentStatusMeta(a.invitation_status || a.status);
    if (statusFilter && meta.key !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(a.name || '').toLowerCase().includes(q) && !(a.email || '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [agents, statusFilter, search]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const av = sortField === 'tickets' ? Number(getAgentTicketsCount(a)) : String(a[sortField] ?? '').toLowerCase();
      const bv = sortField === 'tickets' ? Number(getAgentTicketsCount(b)) : String(b[sortField] ?? '').toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const sortedIdsRef = useRef('');
  useEffect(() => {
    const ids = sorted.map(a => a.id).join(',');
    if (ids === sortedIdsRef.current) return;
    sortedIdsRef.current = ids;
    setSelectedRows(prev => {
      const vis = new Set(sorted.map(a => a.id));
      const next = new Set([...prev].filter(id => vis.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [sorted]);

  const isNotInvitedFilter = statusFilter === 'not_invited';
  useEffect(() => { if (!isNotInvitedFilter) setSelectedRows(new Set()); }, [isNotInvitedFilter]);

  const hasActiveFilters = statusFilter || search || sourceFilter;

  const clearFilters = () => { setStatusFilter(''); setSourceFilter(''); setSearch(''); setPage(1); };

  const invalidateAgents = () => queryClient.invalidateQueries({ queryKey: agentKeys.all() });

  const inviteMutation = useMutation({
    mutationFn: (id) => agentService.invite(id),
    onSuccess: async () => { setBanner({ type: 'success', message: 'Invitation sent.' }); await invalidateAgents(); },
    onError:   (err) => setBanner({ type: 'error', message: err?.message || 'Failed to send invitation.' }),
  });
  const resendMutation = useMutation({
    mutationFn: (id) => agentService.resendInvite(id),
    onSuccess: async () => { setBanner({ type: 'success', message: 'Invitation resent.' }); await invalidateAgents(); },
    onError:   (err) => setBanner({ type: 'error', message: err?.message || 'Failed to resend.' }),
  });
  const bulkInviteMutation = useMutation({
    mutationFn: (ids) => agentService.bulkInvite(ids),
    onSuccess: async (_d, ids) => { setBanner({ type: 'success', message: `Invited ${ids.length} agent(s).` }); setSelectedRows(new Set()); await invalidateAgents(); },
    onError:   (err) => setBanner({ type: 'error', message: err?.message || 'Bulk invite failed.' }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => agentService.update(id, data),
    onSuccess: async () => { setBanner({ type: 'success', message: 'Agent updated.' }); await invalidateAgents(); },
    onError:   (err) => setBanner({ type: 'error', message: err?.message || 'Update failed.' }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => agentService.delete(id),
    onSuccess: async () => { setBanner({ type: 'success', message: 'Agent deleted.' }); await invalidateAgents(); },
    onError:   (err) => setBanner({ type: 'error', message: err?.message || 'Delete failed.' }),
  });



  const handleEditSave = (formData) => {
    if (!editingAgent) return;
    updateMutation.mutate({ id: editingAgent.id, data: { name: formData.name } }, { onSuccess: () => setEditingAgent(null) });
  };
  const handleDeleteConfirm = () => {
    if (!deletingAgent) return;
    deleteMutation.mutate(deletingAgent.id, { onSuccess: () => setDeletingAgent(null) });
  };
  const handleInvite = (a) => {
    const [first_name = '', ...rest] = (a.name ?? '').split(' ');
    setInviteTargetAgent({ id: a.id, first_name, last_name: rest.join(' '), email: a.email ?? '' });
    setInviteModalOpen(true);
  };
  const handleInviteAgentSuccess = async (result) => {
    setBanner({ type: 'success', message: `Invite sent to ${result?.admin_email ?? 'agent'}.` });
    await invalidateAgents();
  };

  const getActionButton = (a) => {
    const status = getAgentStatusMeta(a.invitation_status || a.status).key;
    if (status === 'not_invited') return (
      <button className="btn" onClick={() => handleInvite(a)} disabled={inviteMutation.isPending}
        style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: inviteMutation.isPending ? 0.7 : 1 }}>
        <Send size={13} /> Invite
      </button>
    );
    if (status === 'expired') return (
      <button className="btn" onClick={() => resendMutation.mutate(a.id)} disabled={resendMutation.isPending}
        style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, background: '#FF9500', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', opacity: resendMutation.isPending ? 0.7 : 1 }}>
        Resend
      </button>
    );
    return null;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={13} style={{ opacity: 0.35, marginLeft: 4 }} />;
    return sortDir === 'asc' ? <ArrowUp size={13} style={{ marginLeft: 4, color: 'var(--primary)' }} /> : <ArrowDown size={13} style={{ marginLeft: 4, color: 'var(--primary)' }} />;
  };

  const thSort = (field) => ({
    style: { cursor: 'pointer', userSelect: 'none', color: sortField === field ? 'var(--primary)' : undefined, background: sortField === field ? '#EFF6FF' : undefined },
    onClick: () => { if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc'); } },
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ height: 28, width: 120, borderRadius: 6, background: 'var(--border)', animation: 'pulse 1.4s infinite' }} />
      <div className="card" style={{ overflow: 'hidden' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--border)', animation: 'pulse 1.4s infinite' }} />
            <div style={{ flex: 1, height: 13, borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.4s infinite' }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>
            <span onClick={() => navigate('/admin/dashboard')} style={{ cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              Dashboard
            </span>
            {' › '}<span style={{ color: 'var(--text-secondary)' }}>Agents</span>
          </div>
          <h1>Agents</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isFetching && !isLoading && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', opacity: 0.6, animation: 'pulse 1s ease-in-out infinite' }} />}
          <button className="btn btn-primary" onClick={() => setInviteModalOpen(true)}>+ Add Agent</button>
        </div>
      </div>

      {/* Banners */}
      {isError && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: 13.5, display: 'flex', justifyContent: 'space-between' }}>
          <span>{error?.message ?? 'Failed to load agents.'}</span>
          <button onClick={() => refetch()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C', fontWeight: 600, fontFamily: 'inherit' }}>Retry</button>
        </div>
      )}
      {banner && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: banner.type === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${banner.type === 'success' ? '#86EFAC' : '#FCA5A5'}`, color: banner.type === 'success' ? '#166534' : '#B91C1C', fontSize: 13.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{banner.message}</span>
          <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontFamily: 'inherit' }}><X size={14} /></button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="filter-toolbar">
        {/* Search */}
        <div className="filter-search-row">
          <Search size={16} className="filter-search-icon" />
          <input
            className="filter-search-input"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Dropdowns */}
        <div className="filter-dropdowns-row">
          {/* Status */}
          <div className="filter-select-wrap">
            <select className={`filter-select${statusFilter ? ' active' : ''}`} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">Status: All</option>
              <option value="active">Active</option>
              <option value="not_invited">Not Invited</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown size={13} className="filter-chevron" />
          </div>

          {/* Source */}
          <div className="filter-select-wrap">
            <select className={`filter-select${sourceFilter ? ' active' : ''}`} value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }} disabled={isSourceLoading}>
              <option value="">{isSourceLoading ? 'Loading…' : 'Source CRM: All'}</option>
              {sourceSystems.map(s => {
                const label = s.system_name.toLowerCase() === 'espocrm' ? 'EspoCRM' : s.system_name.charAt(0).toUpperCase() + s.system_name.slice(1);
                return <option key={s.id} value={s.system_name}>{label}</option>;
              })}
            </select>
            <ChevronDown size={13} className="filter-chevron" />
          </div>

          {hasActiveFilters && <button className="filter-clear-btn" onClick={clearFilters}>Clear Filters</button>}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isNotInvitedFilter && (
                  <th style={{ width: 40, textAlign: 'center', cursor: 'pointer' }} onClick={() => { if (!isNotInvitedFilter) return; setSelectedRows(selectedRows.size === sorted.length ? new Set() : new Set(sorted.map(a => a.id))); }}>
                    <input type="checkbox" checked={selectedRows.size === sorted.length && sorted.length > 0} onChange={() => {}} style={{ cursor: 'pointer' }} />
                  </th>
                )}
                <th {...thSort('name')}><span style={{ display: 'flex', alignItems: 'center' }}>USER NAME <SortIcon field="name" /></span></th>
                <th>EMAIL</th>
                <th {...thSort('status')}><span style={{ display: 'flex', alignItems: 'center' }}>STATUS <SortIcon field="status" /></span></th>
                <th>ACTIVE</th>
                <th {...thSort('tickets')}><span style={{ display: 'flex', alignItems: 'center' }}>TICKETS <SortIcon field="tickets" /></span></th>
                <th>CRM</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={isNotInvitedFilter ? 8 : 7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>{agents.length === 0 ? 'No agents found.' : 'No agents match your filters.'}</td></tr>
              ) : sorted.map((a, i) => (
                <tr key={a.id} className="animate-in" style={{ animationDelay: `${i * 0.04}s`, background: isNotInvitedFilter && selectedRows.has(a.id) ? 'var(--primary-light)' : 'transparent' }}>
                  {isNotInvitedFilter && (
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedRows.has(a.id)} onChange={() => { const next = new Set(selectedRows); if (next.has(a.id)) next.delete(a.id); else next.add(a.id); setSelectedRows(next); }} style={{ cursor: 'pointer' }} />
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: getAvatarColor(a.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>{getInitials(a.name)}</div>
                      <span style={{ fontWeight: 600, color: '#000' }}>{a.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{a.email || '—'}</td>
                  <td>
                    {(() => {
                      const meta = getAgentStatusMeta(a.invitation_status || a.status);
                      const Icon = meta.key === 'not_invited' ? XCircle : meta.key === 'pending' ? Clock3 : meta.key === 'expired' || meta.key === 'rejected' ? AlertTriangle : CheckCircle2;
                      return <span className={`badge ${meta.badgeClass}`} style={{ gap: 6 }}><Icon size={12} /> {meta.label}</span>;
                    })()}
                  </td>
                  <td>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: getAgentIsActive(a) ? '#15803D' : '#B91C1C' }}>{getAgentActiveStatus(a)}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 600 }}>{getAgentTicketsCount(a)}</td>
                  <td><CrmBadgesDisplay crms={getAgentCrmSources(a)} maxDisplay={2} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="row-actions">
                      {getActionButton(a)}
                      {getAgentStatusMeta(a.invitation_status || a.status).key === 'active' && (
                        <>
                          <button
                            className="icon-action-btn edit"
                            type="button"
                            title="Edit agent"
                            aria-label="Edit agent"
                            onClick={() => setEditingAgent(a)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="icon-action-btn delete"
                            type="button"
                            title="Delete agent"
                            aria-label="Delete agent"
                            onClick={() => setDeletingAgent(a)}
                          >
                            <UserX size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span>Showing {sorted.length} of {pagination.total} agent{pagination.total !== 1 ? 's' : ''}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isNotInvitedFilter && (
              <button className="btn" onClick={() => bulkInviteMutation.mutate(sorted.filter(a => selectedRows.has(a.id)).map(a => a.id))} disabled={selectedRows.size === 0 || bulkInviteMutation.isPending}
                style={{ padding: '6px 14px', fontSize: 13, fontWeight: 600, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: selectedRows.size === 0 ? 'not-allowed' : 'pointer', opacity: selectedRows.size === 0 ? 0.55 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={14} /> Invite Users ({selectedRows.size})
              </button>
            )}
            {pagination.total_pages > 1 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => setPage(p => p - 1)} disabled={page <= 1 || isFetching} style={{ padding: '4px 10px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
                <span>Page {page} of {pagination.total_pages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.total_pages || isFetching} style={{ padding: '4px 10px', cursor: page >= pagination.total_pages ? 'not-allowed' : 'pointer' }}>Next</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <EditAgentModal agent={editingAgent} isOpen={!!editingAgent} onClose={() => setEditingAgent(null)} onSave={handleEditSave} isSaving={updateMutation.isPending} />
      <ConfirmDeleteModal agent={deletingAgent} isOpen={!!deletingAgent} onClose={() => setDeletingAgent(null)} onConfirm={handleDeleteConfirm} isDeleting={deleteMutation.isPending} />
      <InviteAgentModal isOpen={inviteModalOpen} onClose={() => { setInviteModalOpen(false); setInviteTargetAgent(null); }} onSuccess={handleInviteAgentSuccess} agentId={inviteTargetAgent?.id ?? null} initialData={inviteTargetAgent ?? null} />
    </div>
  );
}
