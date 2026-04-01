import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Database, Calendar, AlertTriangle, Activity, Send, XCircle, Clock3, CheckCircle2, Edit2, UserX } from 'lucide-react';
import { useState } from 'react';
import { agentService, agentKeys } from '../../services/agentService';
import { getInitials, getAvatarColor, formatDate, getAgentStatusMeta, getAgentRouteSlug, getAgentActiveStatus, getAgentIsActive, getAgentCrmSources } from '../../utils/helpers';
import EditAgentModal from '../../components/EditAgentModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import CrmBadgesDisplay from '../../components/CrmBadgesDisplay';

export default function AgentDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [editingAgent, setEditingAgent] = useState(null);
  const [deletingAgent, setDeletingAgent] = useState(null);

  // If navigated from the Agents list the row is in router state —
  // use it as initialData so the page renders immediately.
  const preloaded = location.state?.agent && getAgentRouteSlug(location.state.agent) === slug
    ? location.state.agent
    : undefined;

  const {
    data:     agent,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey:             agentKeys.detail(slug),
    queryFn:              () => agentService.getBySlug(slug),
    initialData:          preloaded,
    initialDataUpdatedAt: preloaded ? Date.now() : undefined,
    staleTime:            30_000,
  });

  const inviteMutation = useMutation({
    mutationFn: (id) => agentService.invite(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agentKeys.all() });
      await refetch();
    },
  });

  const resendMutation = useMutation({
    mutationFn: (id) => agentService.resendInvite(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agentKeys.all() });
      await refetch();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => agentService.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agentKeys.all() });
      await refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => agentService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agentKeys.all() });
      navigate('/admin/agents');
    },
  });

  const handleEditSave = (formData) => {
    if (!agent) return;
    updateMutation.mutate(
      { id: agent.id, data: { name: formData.name } },
      {
        onSuccess: () => {
          setEditingAgent(null);
        },
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!agent) return;
    deleteMutation.mutate(agent.id, {
      onSuccess: () => {
        setDeletingAgent(null);
      },
    });
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError && !agent) return (
    <div style={{ maxWidth: 520, margin: '40px auto' }}>
      <div style={{
        background: '#FEF2F2', border: '1px solid #FCA5A5',
        borderRadius: 'var(--radius)', padding: 24,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center',
      }}>
        <AlertTriangle size={32} color="#DC2626" />
        <div style={{ fontWeight: 600, color: '#DC2626' }}>
          {error?.message ?? 'Could not load agent.'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate('/admin/agents')}>
            <ArrowLeft size={15} /> Back
          </button>
          <button className="btn btn-primary" onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    </div>
  );

  if (!agent) return null;

  const statusMeta = getAgentStatusMeta(agent.status);
  const StatusIcon = statusMeta.key === 'not_invited'
    ? XCircle
    : statusMeta.key === 'pending'
      ? Clock3
      : statusMeta.key === 'expired'
        ? AlertTriangle
        : CheckCircle2;

  return (
    <div style={{ margin: '0 auto', padding: '0 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/admin/agents')} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          <span
            onClick={() => navigate('/admin/agents')}
            style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Agents
          </span>
          {' › '}{agent.name}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

        {/* Left — profile card */}
        <div className="card animate-in" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            {statusMeta.key === 'not_invited' && (
              <button
                className="btn"
                onClick={() => inviteMutation.mutate(agent.id)}
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
            )}

            {statusMeta.key === 'expired' && (
              <button
                className="btn"
                onClick={() => resendMutation.mutate(agent.id)}
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
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-ghost"
                onClick={() => setEditingAgent(agent)}
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                <Edit2 size={13} />
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setDeletingAgent(agent)}
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  color: '#DC2626',
                }}
              >
                <UserX size={13} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
              background: getAvatarColor(agent.name),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: 'white',
            }}>
              {getInitials(agent.name)}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700 }}>{agent.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span className={`badge ${statusMeta.badgeClass}`} style={{ gap: 6 }}>
                  <StatusIcon size={12} /> {statusMeta.label}
                </span>
                {agent.source && (
                  <span className="badge badge-agent">{agent.source}</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {agent.email && (
              <a
                href={`mailto:${agent.email}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--primary)', textDecoration: 'none' }}
              >
                <Mail size={15} /> {agent.email}
              </a>
            )}
            {agent.joined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                <Calendar size={15} /> Joined {formatDate(agent.joined)}
              </div>
            )}
          </div>
        </div>

        {/* Right — sidebar */}
        <div className="card animate-in" style={{ padding: 20, animationDelay: '0.08s' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 18,
          }}>
            Agent Details
          </div>

          {[
            {
              icon: Activity,
              label: 'Status',
              value: (
                <span className={`badge ${statusMeta.badgeClass}`} style={{ gap: 6 }}>
                  <StatusIcon size={12} /> {statusMeta.label}
                </span>
              ),
            },
            {
              icon: Activity,
              label: 'Active',
              value: (
                <span style={{ fontSize: 13, fontWeight: 600, color: getAgentIsActive(agent) ? '#16A34A' : '#DC2626' }}>
                  {getAgentActiveStatus(agent)}
                </span>
              ),
            },
            agent.source && {
              icon: Database,
              label: 'Source System',
              value: <span className="badge badge-agent">{agent.source}</span>,
            },
            getAgentCrmSources(agent).length > 0 && {
              icon: Database,
              label: 'CRM Systems',
              value: <CrmBadgesDisplay crms={getAgentCrmSources(agent)} maxDisplay={2} />,
            },
            agent.joined && {
              icon: Calendar,
              label: 'Member Since',
              value: (
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {formatDate(agent.joined) || '—'}
                </span>
              ),
            },
          ].filter(Boolean).map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ marginBottom: 18 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                fontWeight: 600, marginBottom: 5,
              }}>
                <Icon size={11} /> {label}
              </div>
              {value}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
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
    </div>
  );
}