import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Eye,
  Edit2,
  UserX,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  MoreVertical,
  Send,
  X,
  XCircle,
  Clock3,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentService, agentKeys } from '../../services/agentService';
// ── ADDED: Import tenantService to fetch dynamic CRMs ──
import { tenantService, tenantKeys } from '../../services/tenantService';
import {
  getInitials,
  getAvatarColor,
  getAgentStatusMeta,
  getAgentRouteSlug,
  getAgentCrmSources,
  getAgentTicketsCount,
  getAgentActiveStatus,
  getAgentIsActive,
} from '../../utils/helpers';
import EditAgentModal from '../../components/EditAgentModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import CrmBadgesDisplay from '../../components/CrmBadgesDisplay';
import InviteAgentModal from '../../components/InviteAgentModal';

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Row action menu
// ---------------------------------------------------------------------------
function RowActionMenu({ onClose, isOpen, onView, onEdit, onDelete }) {
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    if (isOpen) window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        bottom: -110,
        right: 0,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 100,
        minWidth: 140,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      {[
        {
          label: 'View', icon: <Eye size={14} />,
          onClick: () => { onView(); onClose(); },
          danger: false, border: false,
        },
        {
          label: 'Edit', icon: <Edit2 size={14} />,
          onClick: () => { onEdit(); onClose(); },
          danger: false, border: true,
        },
        {
          label: 'Delete', icon: <UserX size={14} />,
          onClick: () => { onDelete(); onClose(); },
          danger: true, border: true,
        },
      ].map(({ label, icon, onClick, danger, border }) => (
        <button
          key={label}
          onClick={onClick}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: 'none',
            borderTop: border ? '1px solid var(--border-light)' : 'none',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: 13,
            color: danger ? 'var(--danger)' : 'var(--text-primary)',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {icon} {label}
        </button>
      ))}
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Agents page
// ---------------------------------------------------------------------------
export default function Agents() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [search,             setSearch]             = useState('');
  const [sortField,          setSortField]          = useState('');
  const [sortDir,            setSortDir]            = useState('asc');
  const [statusFilter,       setStatusFilter]       = useState('');
  const [sourceFilter,       setSourceFilter]       = useState('');
  const [page,               setPage]               = useState(1);
  const [selectedRows,       setSelectedRows]       = useState(new Set());
  const [openMenuId,         setOpenMenuId]         = useState(null);
  const [banner,             setBanner]             = useState(null);
  const [editingAgent,       setEditingAgent]       = useState(null);
  const [deletingAgent,      setDeletingAgent]      = useState(null);
  const [inviteModalOpen,    setInviteModalOpen]    = useState(false);
  const [inviteTargetAgent,  setInviteTargetAgent]  = useState(null);

  // ── Fetch dynamic CRM sources for the filters ────────────────────────────
  const { data: sourceSystems = [], isLoading: isSourceLoading } = useQuery({
    queryKey: tenantKeys.sourceSystems(),
    queryFn: () => tenantService.getSourceSystems(),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  // ── Query ────────────────────────────────────────────────────────────────
  const queryParams = {
    page,
    page_size: PAGE_SIZE,
    include_inactive: true,
    ...(sourceFilter ? { source: sourceFilter } : {}),
  };

  const useFilterEndpoint = !!sourceFilter;

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: useFilterEndpoint
      ? [...agentKeys.list(queryParams), 'filter']
      : agentKeys.list(queryParams),
    queryFn: () => useFilterEndpoint
      ? agentService.filter(queryParams)
      : agentService.getAll(queryParams),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const agents     = data?.items       ?? [];
  const pagination = {
    total:       data?.total       ?? 0,
    total_pages: data?.total_pages ?? 1,
  };

  // ── Client-side filter + sort ──────────────────────────────────────────────
  const filtered = useMemo(() => agents.filter(a => {
    const statusMeta = getAgentStatusMeta(a.invitation_status || a.status);
    if (statusFilter && statusMeta.key !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !(a.name  || '').toLowerCase().includes(q) &&
        !(a.email || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  }), [agents, statusFilter, search])

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const av = sortField === 'tickets'
        ? Number(getAgentTicketsCount(a))
        : String(a[sortField] ?? '').toLowerCase();
      const bv = sortField === 'tickets'
        ? Number(getAgentTicketsCount(b))
        : String(b[sortField] ?? '').toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 :  1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  // ── Prune selectedRows when visible agents change ─────────────────────────
  const sortedIdsRef = useRef('');
  useEffect(() => {
    const ids = sorted.map(a => a.id).join(',');
    if (ids === sortedIdsRef.current) return;
    sortedIdsRef.current = ids;

    setSelectedRows(prev => {
      const visibleIds = new Set(sorted.map(a => a.id));
      const next = new Set([...prev].filter(id => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [sorted]);

  // ── Clear selection when leaving not_invited filter ───────────────────────
  const isNotInvitedFilter = statusFilter === 'not_invited';
  useEffect(() => {
    if (!isNotInvitedFilter) setSelectedRows(new Set());
  }, [isNotInvitedFilter]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const toggleRow = (id) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedRows(next);
  };

  const toggleAllRows = () => {
    if (!isNotInvitedFilter) return;
    setSelectedRows(
      selectedRows.size === sorted.length
        ? new Set()
        : new Set(sorted.map(a => a.id))
    );
  };

  const hasActiveFilters = statusFilter || search || sourceFilter;

  const selectedInviteCandidates = useMemo(
    () => sorted.filter(a => selectedRows.has(a.id)),
    [sorted, selectedRows],
  );

  const clearFilters = () => {
    setStatusFilter('');
    setSourceFilter('');
    setSearch('');
    setPage(1);
  };

  const invalidateAgents = async () => {
    await queryClient.invalidateQueries({ queryKey: agentKeys.all() });
  };

  // ── Mutations ─────────────────────────────────────────────────────────────
  const inviteMutation = useMutation({
    mutationFn: (id) => agentService.invite(id),
    onSuccess: async () => {
      setBanner({ type: 'success', message: 'Invitation sent successfully.' });
      await invalidateAgents();
    },
    onError: (err) => {
      setBanner({ type: 'error', message: err?.message || 'Failed to send invitation.' });
    },
  });

  const resendMutation = useMutation({
    mutationFn: (id) => agentService.resendInvite(id),
    onSuccess: async () => {
      setBanner({ type: 'success', message: 'Invitation resent successfully.' });
      await invalidateAgents();
    },
    onError: (err) => {
      setBanner({ type: 'error', message: err?.message || 'Failed to resend invitation.' });
    },
  });

  const bulkInviteMutation = useMutation({
    mutationFn: (ids) => agentService.bulkInvite(ids),
    onSuccess: async (_data, ids) => {
      setBanner({
        type: 'success',
        message: `Invitation sent successfully to ${ids.length} user${ids.length === 1 ? '' : 's'}.`,
      });
      setSelectedRows(new Set());
      await invalidateAgents();
    },
    onError: (err) => {
      setBanner({ type: 'error', message: err?.message || 'Failed to send bulk invitations.' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => agentService.update(id, data),
    onSuccess: async () => {
      setBanner({ type: 'success', message: 'Agent updated successfully.' });
      await invalidateAgents();
    },
    onError: (err) => {
      setBanner({ type: 'error', message: err?.message || 'Failed to update agent.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => agentService.delete(id),
    onSuccess: async () => {
      setBanner({ type: 'success', message: 'Agent deleted successfully.' });
      await invalidateAgents();
    },
    onError: (err) => {
      setBanner({ type: 'error', message: err?.message || 'Failed to delete agent.' });
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const goToDetail = (agent) => {
    navigate(`/admin/agents/detail/${getAgentRouteSlug(agent)}`, { state: { agent } });
  };

  const handleEditOpen   = (agent) => setEditingAgent(agent);
  const handleDeleteOpen = (agent) => setDeletingAgent(agent);

  const handleEditSave = (formData) => {
    if (!editingAgent) return;
    updateMutation.mutate(
      { id: editingAgent.id, data: { name: formData.name } },
      { onSuccess: () => setEditingAgent(null) },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingAgent) return;
    deleteMutation.mutate(deletingAgent.id, {
      onSuccess: () => setDeletingAgent(null),
    });
  };

  const handleInvite = (agent) => {
    const [first_name = '', ...rest] = (agent.name ?? '').split(' ');
    const last_name = rest.join(' ');
    setInviteTargetAgent({
      id:         agent.id,
      first_name,
      last_name,
      email:      agent.email ?? '',
    });
    setInviteModalOpen(true);
  };
  const handleResend     = (agent) => resendMutation.mutate(agent.id);
  const handleBulkInvite = () => {
    if (selectedInviteCandidates.length === 0) return;
    bulkInviteMutation.mutate(selectedInviteCandidates.map(a => a.id));
  };

  // ── NEW: handle successful agent invite from modal ────────────────────────
  const handleInviteAgentSuccess = async (result) => {
    setBanner({
      type: 'success',
      message: `Invite sent to ${result?.admin_email ?? 'agent'}. Link expires in 24 hours.`,
    });
    await invalidateAgents();
  };

  // ── Action button per status ──────────────────────────────────────────────
  const getActionButton = (agent) => {
    const status = getAgentStatusMeta(agent.invitation_status || agent.status).key;

    if (status === 'not_invited') return (
      <button
        className="btn"
        onClick={() => handleInvite(agent)}
        disabled={inviteMutation.isPending}
        style={{
          padding: '6px 12px', fontSize: 12, fontWeight: 600,
          background: 'var(--primary)', color: 'white',
          border: 'none', borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          opacity: inviteMutation.isPending ? 0.7 : 1,
        }}
      >
        <Send size={13} /> Invite
      </button>
    );

    if (status === 'expired') return (
      <button
        className="btn"
        onClick={() => handleResend(agent)}
        disabled={resendMutation.isPending}
        style={{
          padding: '6px 12px', fontSize: 12, fontWeight: 600,
          background: '#FF9500', color: 'white',
          border: 'none', borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', opacity: resendMutation.isPending ? 0.7 : 1,
        }}
      >
        Resend
      </button>
    );

    return null;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={13} style={{ opacity: 0.35, marginLeft: 4 }} />;
    return sortDir === 'asc'
      ? <ArrowUp   size={13} style={{ marginLeft: 4, color: 'var(--primary)' }} />
      : <ArrowDown size={13} style={{ marginLeft: 4, color: 'var(--primary)' }} />;
  };

  const thSort = (field) => ({
    style: {
      cursor: 'pointer', userSelect: 'none',
      color:      sortField === field ? 'var(--primary)' : undefined,
      background: sortField === field ? '#EFF6FF'        : undefined,
    },
    onClick: () => handleSort(field),
  });

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ height: 28, width: 120, borderRadius: 6, background: 'var(--border)', animation: 'pulse 1.4s infinite' }} />
      <div className="card" style={{ overflow: 'hidden' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--border)', flexShrink: 0, animation: 'pulse 1.4s infinite' }} />
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--border)', flexShrink: 0, animation: 'pulse 1.4s infinite' }} />
            <div style={{ flex: 1, height: 13, borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.4s infinite' }} />
            <div style={{ width: 60, height: 22, borderRadius: 99, background: 'var(--border)', animation: 'pulse 1.4s infinite' }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span
              onClick={() => navigate('/admin/dashboard')}
              style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Dashboard
            </span>
            {' › '}<span style={{ color: 'var(--text-primary)' }}>Agents</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Agents</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isFetching && !isLoading && (
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--primary)', opacity: 0.6,
              animation: 'pulse 1s ease-in-out infinite',
            }} />
          )}
          <button
            className="btn btn-primary"
            onClick={() => setInviteModalOpen(true)}
          >
            + Add Agent
          </button>
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: '#FEF2F2', border: '1px solid #FCA5A5',
          color: '#DC2626', fontSize: 13.5,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{error?.message ?? 'Failed to load agents.'}</span>
          <button
            onClick={() => refetch()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 600, fontFamily: 'inherit' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Success / error banner */}
      {banner && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: banner.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${banner.type === 'success' ? '#86EFAC' : '#FCA5A5'}`,
          color: banner.type === 'success' ? '#166534' : '#DC2626',
          fontSize: 13.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{banner.message}</span>
          <button
            onClick={() => setBanner(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontFamily: 'inherit' }}
            aria-label="Close banner"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search + filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="card" style={{ padding: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32, width: '100%' }}
              placeholder="Search agents…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              appearance: 'none', padding: '8px 28px 8px 12px',
              border: `1px solid ${statusFilter ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              background: statusFilter ? 'var(--primary-light)' : 'var(--surface)',
              fontSize: 13.5, color: statusFilter ? 'var(--primary)' : 'var(--text-primary)',
              cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
              fontWeight: statusFilter ? 600 : 400, minWidth: 150,
            }}
          >
            <option value="">Status: All</option>
            <option value="active">Status: Active</option>
            <option value="not_invited">Status: Not Invited</option>
            <option value="pending">Status: Pending</option>
            <option value="expired">Status: Expired</option>
            <option value="rejected">Status: Rejected</option>
          </select>

          {/* Source filter ── NOW DYNAMICALLY MAPPED FROM DB ── */}
          <select
            value={sourceFilter}
            onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
            disabled={isSourceLoading}
            style={{
              appearance: 'none', padding: '8px 28px 8px 12px',
              border: `1px solid ${sourceFilter ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              background: sourceFilter ? 'var(--primary-light)' : 'var(--surface)',
              fontSize: 13.5, color: sourceFilter ? 'var(--primary)' : 'var(--text-primary)',
              cursor: isSourceLoading ? 'not-allowed' : 'pointer', 
              outline: 'none', fontFamily: 'inherit',
              fontWeight: sourceFilter ? 600 : 400, minWidth: 150,
              opacity: isSourceLoading ? 0.7 : 1,
            }}
          >
            <option value="">{isSourceLoading ? 'Loading Sources...' : 'Source: All'}</option>
            {sourceSystems.map(system => {
              const label = system.system_name.toLowerCase() === 'espocrm' 
                ? 'EspoCRM' 
                : system.system_name.charAt(0).toUpperCase() + system.system_name.slice(1);
              return (
                <option key={system.id} value={system.system_name}>
                  Source: {label}
                </option>
              );
            })}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 12px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', background: 'transparent',
                cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Active Filters:</span>
            {[
              statusFilter && { label: `Status: ${statusFilter}`, onRemove: () => setStatusFilter('') },
              sourceFilter && { label: `Source: ${sourceFilter}`, onRemove: () => setSourceFilter('') },
              search       && { label: `Search: ${search}`,       onRemove: () => setSearch('') },
            ].filter(Boolean).map(({ label, onRemove }) => (
              <div key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px',
                backgroundColor: 'var(--primary-light)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12, color: 'var(--primary)', fontWeight: 500,
              }}>
                {label}
                <button
                  onClick={onRemove}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--primary)' }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isNotInvitedFilter && (
                  <th style={{ width: 40, textAlign: 'center', cursor: 'pointer' }} onClick={toggleAllRows}>
                    <input
                      type="checkbox"
                      checked={selectedRows.size === sorted.length && sorted.length > 0}
                      onChange={toggleAllRows}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                )}
                <th {...thSort('name')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>USER NAME <SortIcon field="name" /></span>
                </th>
                <th>EMAIL</th>
                <th {...thSort('status')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>STATUS <SortIcon field="status" /></span>
                </th>
                <th>
                  <span style={{ display: 'flex', alignItems: 'center' }}>ACTIVE</span>
                </th>
                <th {...thSort('tickets')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>TICKETS <SortIcon field="tickets" /></span>
                </th>
                <th>CRM</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={isNotInvitedFilter ? 8 : 7}
                    style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}
                  >
                    {agents.length === 0 ? 'No agents found.' : 'No agents match your filters.'}
                  </td>
                </tr>
              ) : sorted.map((a, i) => (
                <tr
                  key={a.id}
                  className="animate-in"
                  style={{
                    cursor: 'pointer',
                    animationDelay: `${i * 0.04}s`,
                    background: isNotInvitedFilter && selectedRows.has(a.id)
                      ? 'var(--primary-light)'
                      : 'transparent',
                  }}
                >
                  {isNotInvitedFilter && (
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(a.id)}
                        onChange={() => toggleRow(a.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}

                  {/* Name */}
                  <td onClick={() => goToDetail(a)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: getAvatarColor(a.name),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: 'white',
                      }}>
                        {getInitials(a.name)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{a.name || '—'}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13.5 }} onClick={() => goToDetail(a)}>
                    {a.email || '—'}
                  </td>

                  {/* Status */}
                  <td onClick={() => goToDetail(a)}>
                    {(() => {
                      const meta = getAgentStatusMeta(a.invitation_status || a.status);
                      const Icon = meta.key === 'not_invited'
                        ? XCircle
                        : meta.key === 'pending'
                          ? Clock3
                          : meta.key === 'expired' || meta.key === 'rejected'
                            ? AlertTriangle
                            : CheckCircle2;
                      return (
                        <span className={`badge ${meta.badgeClass}`} style={{ gap: 6 }}>
                          <Icon size={12} /> {meta.label}
                        </span>
                      );
                    })()}
                  </td>
                  {/* Active */}
                  <td onClick={() => goToDetail(a)}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: getAgentIsActive(a) ? '#16A34A' : '#DC2626' }}>
                      {getAgentActiveStatus(a)}
                    </span>
                  </td>

                  {/* Tickets */}
                  <td onClick={() => goToDetail(a)} style={{ color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 600 }}>
                    {getAgentTicketsCount(a)}
                  </td>

                  {/* CRM */}
                  <td onClick={() => goToDetail(a)}>
                    <CrmBadgesDisplay crms={getAgentCrmSources(a)} maxDisplay={2} />
                  </td>

                  {/* Actions */}
                  <td onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {getActionButton(a)}
                      {getAgentStatusMeta(a.invitation_status || a.status).key === 'active' && (
                        <>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: '5px 8px', position: 'relative' }}
                            onClick={() => setOpenMenuId(openMenuId === a.id ? null : a.id)}
                          >
                            <MoreVertical size={16} />
                          </button>
                          <RowActionMenu
                            isOpen={openMenuId === a.id}
                            onClose={() => setOpenMenuId(null)}
                            onView={() => goToDetail(a)}
                            onEdit={() => handleEditOpen(a)}
                            onDelete={() => handleDeleteOpen(a)}
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          fontSize: 13, color: 'var(--text-secondary)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <span>
            Showing {sorted.length} of {pagination.total} agent{pagination.total !== 1 ? 's' : ''}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isNotInvitedFilter && (
              <button
                className="btn"
                onClick={handleBulkInvite}
                disabled={selectedRows.size === 0 || bulkInviteMutation.isPending}
                style={{
                  padding: '6px 14px', fontSize: 13, fontWeight: 600,
                  background: 'var(--primary)', color: 'white',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  cursor: selectedRows.size === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedRows.size === 0 ? 0.55 : 1,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Send size={14} /> Invite Users ({selectedRows.size})
              </button>
            )}

            {pagination.total_pages > 1 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page <= 1 || isFetching}
                  style={{ padding: '4px 10px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  Prev
                </button>
                <span>Page {page} of {pagination.total_pages}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= pagination.total_pages || isFetching}
                  style={{ padding: '4px 10px', cursor: page >= pagination.total_pages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <EditAgentModal
        agent={editingAgent}
        isOpen={!!editingAgent}
        onClose={() => setEditingAgent(null)}
        onSave={handleEditSave}
        isSaving={updateMutation.isPending}
      />

      <ConfirmDeleteModal
        agent={deletingAgent}
        isOpen={!!deletingAgent}
        onClose={() => setDeletingAgent(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />

      <InviteAgentModal
        isOpen={inviteModalOpen}
        onClose={() => {
          setInviteModalOpen(false);
          setInviteTargetAgent(null);   // clear target on close
        }}
        onSuccess={handleInviteAgentSuccess}
        // These two props are undefined when "+ Add Agent" opens the modal,
        // so the modal stays in "new agent" mode. They are set when a row
        // Invite button is clicked.
        agentId={inviteTargetAgent?.id ?? null}
        initialData={inviteTargetAgent ?? null}
      />
    </div>
  );
}