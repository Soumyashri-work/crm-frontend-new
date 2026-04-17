/**
 * src/pages/admin/Agents.jsx — REFACTORED (PHASE 6)
 *
 * Uses DataTable component for search, sort, filter, pagination + checkboxes
 * Maintains all invite/update/delete mutations
 * Pagination logic now internal to DataTable component
 */

import { useState, useEffect, useMemo } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Send, Edit2, Trash2, X } from 'lucide-react';
import { DataTable } from '../../components/DataTable';
import { agentService, agentKeys } from '../../services/agentService';
import { tenantService, tenantKeys } from '../../services/tenantService';
import { PAGE_SIZE } from '../../constants/pagination';
import {
  getInitials,
  getAvatarColor,
  getAgentStatusMeta,
  getAgentCrmSources,
  getAgentTicketsCount,
  getAgentActiveStatus,
  getAgentIsActive,
} from '../../utils/helpers';
import EditAgentModal from '../../components/EditAgentModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import CrmBadgesDisplay from '../../components/CrmBadgesDisplay';
import InviteAgentModal from '../../components/InviteAgentModal';

// ─── Badge component for status ──────────────────────────────────────
function StatusBadge({ agent }) {
  const meta = getAgentStatusMeta(agent.invitation_status || agent.status);
  const statusColors = {
    active: { bg: '#ECFDF5', color: '#065F46', icon: '✓' },
    pending: { bg: '#FEF3C7', color: '#92400E', icon: '●' },
    not_invited: { bg: '#FEE2E2', color: '#991B1B', icon: '○' },
    expired: { bg: '#FECACA', color: '#7F1D1D', icon: '⚠' },
    rejected: { bg: '#FECACA', color: '#7F1D1D', icon: '✕' },
  };
  const style = statusColors[meta.key] || statusColors.pending;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 'var(--radius-sm)',
        background: style.bg,
        color: style.color,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {style.icon} {meta.label}
    </span>
  );
}

export default function Agents() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ─── Filter state ────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [banner, setBanner] = useState(null);

  // ─── Modal state ────────────────────────────────────────────────────
  const [editingAgent, setEditingAgent] = useState(null);
  const [deletingAgent, setDeletingAgent] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteTargetAgent, setInviteTargetAgent] = useState(null);

  // ─── Fetch source systems for filter ─────────────────────────────────
  const { data: sourceSystems = [] } = useQuery({
    queryKey: tenantKeys.sourceSystems(),
    queryFn: () => tenantService.getSourceSystems(),
    staleTime: 5 * 60 * 1000,
  });

  // ─── Fetch agents ───────────────────────────────────────────────────
  const queryParams = {
    page,
    page_size: PAGE_SIZE.DEFAULT,
    include_inactive: true,
    ...(sourceFilter ? { source: sourceFilter } : {}),
  };

  const useFilterEndpoint = !!sourceFilter;
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: useFilterEndpoint
      ? [...agentKeys.list(queryParams), 'filter']
      : agentKeys.list(queryParams),
    queryFn: () =>
      useFilterEndpoint
        ? agentService.filter(queryParams)
        : agentService.getAll(queryParams),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const agents = data?.items ?? [];

  // ─── Local filtering (search + status filter) ────────────────────────
  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const meta = getAgentStatusMeta(a.invitation_status || a.status);
      if (statusFilter && meta.key !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !(a.name || '').toLowerCase().includes(q) &&
          !(a.email || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [agents, statusFilter, search]);

  // ─── Sorting ─────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      let av, bv;
      if (sortField === 'tickets') {
        av = Number(getAgentTicketsCount(a));
        bv = Number(getAgentTicketsCount(b));
      } else {
        av = String(a[sortField] ?? '').toLowerCase();
        bv = String(b[sortField] ?? '').toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  // ─── Invalidate queries helper ───────────────────────────────────────
  const invalidateAgents = () =>
    queryClient.invalidateQueries({ queryKey: agentKeys.all() });

  // ─── Mutations ───────────────────────────────────────────────────────
  const inviteMutation = useMutation({
    mutationFn: (id) => agentService.invite(id),
    onSuccess: async () => {
      setBanner({ type: 'success', message: 'Invitation sent.' });
      await invalidateAgents();
    },
    onError: (err) =>
      setBanner({
        type: 'error',
        message: err?.message || 'Failed to send invitation.',
      }),
  });

  const resendMutation = useMutation({
    mutationFn: (id) => agentService.resendInvite(id),
    onSuccess: async () => {
      setBanner({ type: 'success', message: 'Invitation resent.' });
      await invalidateAgents();
    },
    onError: (err) =>
      setBanner({
        type: 'error',
        message: err?.message || 'Failed to resend.',
      }),
  });

  const bulkInviteMutation = useMutation({
    mutationFn: (ids) => agentService.bulkInvite(ids),
    onSuccess: async (_d, ids) => {
      setBanner({
        type: 'success',
        message: `Invited ${ids.length} agent(s).`,
      });
      setSelectedRows(new Set());
      await invalidateAgents();
    },
    onError: (err) =>
      setBanner({
        type: 'error',
        message: err?.message || 'Bulk invite failed.',
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => agentService.update(id, data),
    onSuccess: async () => {
      setBanner({ type: 'success', message: 'Agent updated.' });
      await invalidateAgents();
    },
    onError: (err) =>
      setBanner({
        type: 'error',
        message: err?.message || 'Update failed.',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => agentService.delete(id),
    onSuccess: async () => {
      setBanner({ type: 'success', message: 'Agent deleted.' });
      await invalidateAgents();
    },
    onError: (err) =>
      setBanner({
        type: 'error',
        message: err?.message || 'Delete failed.',
      }),
  });

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleRowSelect = (rowId, selected) => {
    const next = new Set(selectedRows);
    if (selected) {
      next.add(rowId);
    } else {
      next.delete(rowId);
    }
    setSelectedRows(next);
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedRows(new Set(sorted.map((a) => a.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleEditSave = (formData) => {
    if (!editingAgent) return;
    updateMutation.mutate(
      { id: editingAgent.id, data: { name: formData.name } },
      { onSuccess: () => setEditingAgent(null) }
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingAgent) return;
    deleteMutation.mutate(deletingAgent.id, {
      onSuccess: () => setDeletingAgent(null),
    });
  };

  const handleInvite = (a) => {
    const [first_name = '', ...rest] = (a.name ?? '').split(' ');
    setInviteTargetAgent({
      id: a.id,
      first_name,
      last_name: rest.join(' '),
      email: a.email ?? '',
    });
    setInviteModalOpen(true);
  };

  const handleInviteAgentSuccess = async () => {
    setBanner({ type: 'success', message: 'Invite sent to agent.' });
    setInviteTargetAgent(null);
    await invalidateAgents();
  };

  // ─── Action button per agent ─────────────────────────────────────────
  const getActionButton = (a) => {
    const status = getAgentStatusMeta(a.invitation_status || a.status).key;
    if (status === 'not_invited') {
      return (
        <button
          onClick={() => handleInvite(a)}
          disabled={inviteMutation.isPending}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: inviteMutation.isPending ? 0.7 : 1,
          }}
        >
          <Send size={13} /> Invite
        </button>
      );
    }
    if (status === 'expired') {
      return (
        <button
          onClick={() => resendMutation.mutate(a.id)}
          disabled={resendMutation.isPending}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            background: '#FF9500',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            opacity: resendMutation.isPending ? 0.7 : 1,
          }}
        >
          Resend
        </button>
      );
    }
    return null;
  };

  // ─── Columns configuration ───────────────────────────────────────────
  const columns = [
    {
      key: 'name',
      label: 'Agent Name',
      sortable: true,
      width: '25%',
      render: (value, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: getAvatarColor(row.name),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {getInitials(row.name)}
          </div>
          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
            {row.name || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: false,
      render: (value) => (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {value || '—'}
        </div>
      ),
    },
    {
      key: 'invitation_status',
      label: 'Status',
      sortable: false,
      render: (value, row) => <StatusBadge agent={row} />,
    },
    {
      key: 'is_active',
      label: 'Active',
      sortable: false,
      render: (value, row) => (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: getAgentIsActive(row) ? '#15803D' : '#B91C1C',
          }}
        >
          {getAgentActiveStatus(row)}
        </div>
      ),
    },
    {
      key: 'tickets',
      label: 'Tickets',
      sortable: true,
      render: (value, row) => (
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {getAgentTicketsCount(row)}
        </div>
      ),
    },
    {
      key: 'source_systems',
      label: 'CRM',
      sortable: false,
      render: (value, row) => (
        <CrmBadgesDisplay crms={getAgentCrmSources(row)} maxDisplay={2} />
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      width: 140,
      render: (value, row) => {
        const status = getAgentStatusMeta(row.invitation_status || row.status).key;
        const actionBtn = getActionButton(row);
        const canEdit = status === 'active';

        return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {actionBtn}
            {canEdit && (
              <>
                <button
                  onClick={() => setEditingAgent(row)}
                  style={{
                    padding: 6,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = 'var(--text-muted)')
                  }
                  title="Edit agent"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => setDeletingAgent(row)}
                  style={{
                    padding: 6,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = 'var(--text-muted)')
                  }
                  title="Delete agent"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  // ─── Filter options ─────────────────────────────────────────────────
  const filterOptions = [
    {
      key: 'status',
      label: 'Filter by Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'not_invited', label: 'Not Invited' },
        { value: 'pending', label: 'Pending' },
        { value: 'expired', label: 'Expired' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
    {
      key: 'source',
      label: 'Filter by CRM',
      options: sourceSystems.map((s) => ({
        value: s.system_name || s,
        label: s.system_name || s,
      })),
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginBottom: 4,
              fontWeight: 500,
            }}
          >
            <span
              onClick={() => navigate('/admin/dashboard')}
              style={{ cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = 'var(--primary)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'var(--text-muted)')
              }
            >
              Dashboard
            </span>
            {' › '}
            <span style={{ color: 'var(--text-secondary)' }}>Agents</span>
          </div>
          <h1>Agents</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isFetching && !isLoading && (
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--primary)',
                opacity: 0.6,
                animation: 'pulse 1s ease-in-out infinite',
              }}
            />
          )}
          <button
            onClick={() => setInviteModalOpen(true)}
            style={{
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            + Add Agent
          </button>
        </div>
      </div>

      {/* Banners */}
      {isError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            fontSize: 13.5,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>{error?.message ?? 'Failed to load agents.'}</span>
          <button
            onClick={() => refetch()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#B91C1C',
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            Retry
          </button>
        </div>
      )}
      {banner && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background:
              banner.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${
              banner.type === 'success' ? '#86EFAC' : '#FCA5A5'
            }`,
            color: banner.type === 'success' ? '#166534' : '#B91C1C',
            fontSize: 13.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{banner.message}</span>
          <button
            onClick={() => setBanner(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              fontFamily: 'inherit',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Bulk actions (only if rows selected) */}
      {selectedRows.size > 0 && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--primary-light)',
            border: '1px solid var(--primary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--primary)' }}>
            {selectedRows.size} agent(s) selected
          </div>
          <button
            onClick={() =>
              bulkInviteMutation.mutate(Array.from(selectedRows))
            }
            disabled={bulkInviteMutation.isPending}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              opacity: bulkInviteMutation.isPending ? 0.7 : 1,
            }}
          >
            Bulk Invite
          </button>
        </div>
      )}

      {/* DataTable — PHASE 6: Unified pagination now internal to DataTable */}
      <DataTable
        columns={columns}
        data={sorted}
        pageSize={PAGE_SIZE.DEFAULT}
        currentPage={page}
        onPageChange={setPage}
        loading={isLoading}
        error={isError ? error?.message ?? 'Failed to load agents.' : null}
        onRetry={refetch}
        searchValue={search}
        onSearchChange={setSearch}
        filters={{ status: statusFilter, source: sourceFilter }}
        onFilterChange={(key, value) => {
          if (key === 'status') setStatusFilter(value);
          if (key === 'source') setSourceFilter(value);
          setPage(1);
        }}
        filterOptions={filterOptions}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
        selectedRows={selectedRows}
        onRowSelect={handleRowSelect}
        onSelectAll={handleSelectAll}
        showCheckboxes={statusFilter === 'not_invited'}
        searchPlaceholder="Search by name or email…"
        emptyMessage={
          search || statusFilter || sourceFilter
            ? 'No agents match your filters.'
            : 'No agents found.'
        }
      />

      {/* Modals */}
      {editingAgent && (
        <EditAgentModal
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onSave={handleEditSave}
        />
      )}

      {deletingAgent && (
        <ConfirmDeleteModal
          title={`Delete ${deletingAgent.name}?`}
          message="This agent will be removed from the system. This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingAgent(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {inviteModalOpen && (
        <InviteAgentModal
          agent={inviteTargetAgent}
          onClose={() => {
            setInviteModalOpen(false);
            setInviteTargetAgent(null);
          }}
          onSuccess={handleInviteAgentSuccess}
        />
      )}
    </div>
  );
}