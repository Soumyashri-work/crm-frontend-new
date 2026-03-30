import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Database, Calendar, AlertTriangle, Activity, Hash } from 'lucide-react';
import { agentService, agentKeys } from '../../services/agentService';
import { getInitials, getAvatarColor, formatDate } from '../../utils/helpers';

export default function AgentDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // If navigated from the Agents list the row is in router state —
  // use it as initialData so the page renders immediately.
  const preloaded = location.state?.agent ?? undefined;

  const {
    data:     agent,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey:             agentKeys.detail(id),
    queryFn:              () => agentService.getById(id),
    initialData:          preloaded,
    initialDataUpdatedAt: preloaded ? Date.now() : undefined,
    staleTime:            30_000,
  });

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

  const isActive = (agent.status || '').toLowerCase() === 'active';

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
                <span className={`badge ${isActive ? 'badge-active' : 'badge-inactive'}`}>
                  {agent.status || 'Active'}
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
                <span className={`badge ${isActive ? 'badge-active' : 'badge-inactive'}`}>
                  {agent.status || '—'}
                </span>
              ),
            },
            agent.source && {
              icon: Database,
              label: 'Source System',
              value: <span className="badge badge-agent">{agent.source}</span>,
            },
            agent.crm_agent_id && {
              icon: Hash,
              label: 'CRM Agent ID',
              value: (
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {agent.crm_agent_id}
                </span>
              ),
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
    </div>
  );
}