/**
 * pages/TicketDetails.jsx
 *
 * Sync & freshness strategy
 * ─────────────────────────
 * 1. On page open  → always POST /sync/{id}/comments/sync (hits CRM once)
 * 2. After sync    → GET comments from DB, then poll DB every 30s
 * 3. Background tab → polling pauses (refetchIntervalInBackground: false)
 * 4. User adds comment → cache invalidated immediately
 *
 * This means:
 *  - CRM is only called once per page open regardless of webhook support
 *  - DB is polled cheaply every 30s for any changes (webhook or manual CRM edits)
 *  - No stale data window beyond the poll interval
 *
 * Error handling
 * ──────────────
 * - Sync failure      → yellow warning banner, comments still load from DB cache
 * - Comments failure  → red error banner with retry, classified by HTTP status
 * - Add comment fail  → optimistic update rolled back + dismissible inline error
 * - Ticket load fail  → full error screen with back + retry buttons
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation }       from 'react-router-dom';
import { useQuery, useMutation, useQueryClient }     from '@tanstack/react-query';
import {
  ArrowLeft, User, Database, Clock, Calendar,
  Mail, Phone, ExternalLink, AlertTriangle,
  MessageCircle, Send, Pencil, RefreshCw, WifiOff,
} from 'lucide-react';
import { ticketService, ticketKeys } from '../../services/ticketService';
import { agentService }              from '../../services/agentService';
import EditTicketModal               from '../../components/EditTicketModal';
import {
  statusBadgeClass, priorityBadgeClass, crmBadgeClass,
  formatDateTime, getInitials, getAvatarColor,
} from '../../utils/helpers';

// ─── Constants ────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS   = 30_000;  // Poll DB every 30s — no CRM call, cheap read
const COMMENTS_PAGE_SIZE = 50;

// ─── HTML sanitiser (swap for DOMPurify.sanitize if available) ────────────────
const sanitise = (html) => {
  if (!html) return '';
  try {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('script,[onerror],[onclick],[onload],[onmouseover]')
       .forEach((el) => el.remove());
    return div.innerHTML;
  } catch {
    return String(html).replace(/<[^>]*>/g, '');
  }
};

// ─── Maps API error to a user-friendly message ───────────────────────────────
const getErrorMessage = (error, fallback = 'Something went wrong.') => {
  if (!error) return fallback;
  const status = error?.response?.status;
  if (status === 404) return 'This ticket no longer exists.';
  if (status === 403) return "You don't have permission to view this.";
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status >= 500)  return 'Server error. Please try again in a moment.';
  if (!navigator.onLine) return 'You appear to be offline.';
  return error?.message ?? fallback;
};

// ─── HoverPopup ───────────────────────────────────────────────────────────────
function HoverPopup({ children, popup }) {
  const [visible, setVisible] = useState(false);
  const [pos,     setPos]     = useState({ top: 0, left: 0 });
  const ref      = useRef();
  const timerRef = useRef();

  const show = () => {
    clearTimeout(timerRef.current);
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 8, left: rect.left });
    setVisible(true);
  };
  const hide = () => { timerRef.current = setTimeout(() => setVisible(false), 120); };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <>
      <span ref={ref} onMouseEnter={show} onMouseLeave={hide} style={{ cursor: 'default' }}>
        {children}
      </span>
      {visible && (
        <div
          onMouseEnter={() => clearTimeout(timerRef.current)}
          onMouseLeave={hide}
          style={{
            position: 'fixed', top: pos.top, left: pos.left,
            zIndex: 9999, minWidth: 220, maxWidth: 280,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
            padding: '14px 16px', animation: 'fadeIn 0.15s ease',
          }}
        >
          {popup}
        </div>
      )}
    </>
  );
}

// ─── Popup contents ───────────────────────────────────────────────────────────
function PersonPopup({ name, email, role, phone, extra }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: getAvatarColor(name),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
        }}>
          {getInitials(name)}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{name}</div>
          {role && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{role}</div>}
        </div>
      </div>
      {email && (
        <a href={`mailto:${email}`} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          fontSize: 12.5, color: 'var(--primary)', marginBottom: 6, textDecoration: 'none',
        }}>
          <Mail size={13} /> {email}
        </a>
      )}
      {phone && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 6,
        }}>
          <Phone size={13} /> {phone}
        </div>
      )}
      {extra && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{extra}</div>}
    </div>
  );
}

function CrmPopup({ crm }) {
  const info = {
    EspoCRM: { desc: 'Open-source CRM platform',     color: '#7C3AED', bg: '#F3E8FF' },
    Zammad:  { desc: 'Help desk & ticketing system',  color: '#059669', bg: '#ECFDF5' },
  };
  const d = info[crm] || { desc: 'CRM source', color: 'var(--primary)', bg: 'var(--primary-light)' };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: d.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Database size={15} color={d.color} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{crm}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.desc}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ticket synced from {crm}</div>
    </div>
  );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '116px minmax(0, 1fr)',
      alignItems: 'center',
      gap: 8,
      padding: '10px 0',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 11,
        color: 'var(--text-muted)', textTransform: 'uppercase',
        letterSpacing: '0.06em', fontWeight: 700,
      }}>
        <Icon size={12} /> {label}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ onClick, avatarName, label, icon, linkable }) {
  return (
    <div
      onClick={onClick}
      role={linkable ? 'button' : undefined}
      tabIndex={linkable ? 0 : undefined}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        width: '100%',
        padding: '6px 8px', borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-2)',
        cursor: linkable ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (linkable) e.currentTarget.style.background = 'var(--primary-light)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; }}
    >
      {avatarName && (
        <div style={{
          width: 24, height: 24, borderRadius: '50%', background: getAvatarColor(avatarName),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0,
        }}>
          {getInitials(avatarName)}
        </div>
      )}
      {icon}
      <span style={{ fontSize: 13, color: linkable ? 'var(--primary)' : 'inherit', fontWeight: linkable ? 500 : 400 }}>
        {label}
      </span>
      {linkable && <ExternalLink size={11} color="var(--primary)" />}
    </div>
  );
}

// ─── Comment Skeleton ─────────────────────────────────────────────────────────
function CommentSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20, minHeight: 160 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, opacity: 1 - i * 0.25 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: 'var(--border)',
            flexShrink: 0, animation: 'pulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              height: 12, width: `${28 + i * 6}%`, borderRadius: 4,
              background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }} />
            <div style={{
              height: 48, borderRadius: 6, background: 'var(--border)',
              animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.15}s`,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Banners ──────────────────────────────────────────────────────────────────
function SyncWarningBanner({ onRetry, syncing }) {
  return (
    <div style={{
      padding: '8px 12px', borderRadius: 'var(--radius-sm)',
      background: '#FFFBEB', border: '1px solid #FCD34D',
      color: '#92400E', fontSize: 12.5, marginBottom: 12,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
    }}>
      <span>⚠ Could not sync latest comments from CRM. Showing cached data.</span>
      <button
        onClick={onRetry}
        disabled={syncing}
        style={{
          background: 'none', border: 'none', cursor: syncing ? 'not-allowed' : 'pointer',
          color: '#92400E', fontWeight: 600, fontSize: 12.5, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 4,
          whiteSpace: 'nowrap', opacity: syncing ? 0.6 : 1,
        }}
      >
        <RefreshCw size={12} style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }} />
        {syncing ? 'Syncing…' : 'Retry'}
      </button>
    </div>
  );
}

function CommentErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 'var(--radius-sm)',
      background: '#FEF2F2', border: '1px solid #FCA5A5',
      color: '#DC2626', fontSize: 13, marginBottom: 16,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <WifiOff size={14} /> <span>{message}</span>
      </div>
      <button
        onClick={onRetry}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#DC2626', fontWeight: 600, fontFamily: 'inherit',
          fontSize: 13, whiteSpace: 'nowrap',
        }}
      >
        Retry
      </button>
    </div>
  );
}

function AddCommentErrorBanner({ onDismiss }) {
  return (
    <div style={{
      padding: '8px 12px', borderRadius: 'var(--radius-sm)',
      background: '#FEF2F2', border: '1px solid #FCA5A5',
      color: '#DC2626', fontSize: 12.5, marginTop: 8,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
    }}>
      <span>Failed to post comment. Please try again.</span>
      <button
        onClick={onDismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#DC2626', fontWeight: 700, fontSize: 15,
          fontFamily: 'inherit', lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 16, color = 'white' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid ${color}20`, borderTopColor: color,
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TicketDetails() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const location    = useLocation();
  const queryClient = useQueryClient();

  const isAgent  = location.pathname.startsWith('/agent');
  const base     = isAgent ? '/agent' : '/admin';
  const backPath = isAgent ? `${base}/my-tickets` : `${base}/tickets`;

  const preloaded = location.state?.ticket ?? undefined;

  const [comment,         setComment        ] = useState('');
  const [showEditModal,   setShowEditModal   ] = useState(false);
  const [syncDone,        setSyncDone       ] = useState(false);
  const [syncError,       setSyncError      ] = useState(false);
  const [syncing,         setSyncing        ] = useState(false);
  const [addCommentError, setAddCommentError] = useState(false);

  // ── CRM sync — fires once on page open, gates the comments query ─────────────
  const runSync = useCallback((force = false) => {
    if (syncing && !force) return; // prevent duplicate concurrent syncs
    setSyncError(false);
    setSyncing(true);
    if (!force) setSyncDone(false); // only reset gate on initial load, not manual retry

    ticketService
      .syncComments(id)
      .then(() => setSyncError(false))
      .catch((err) => {
        console.error('[TicketDetails] Comment sync failed:', err);
        setSyncError(true);
      })
      .finally(() => {
        setSyncing(false);
        setSyncDone(true); // always unblock comments query even if sync fails
      });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    runSync();
  }, [runSync]);

  // ── Ticket query ─────────────────────────────────────────────────────────────
  const {
    data:      ticket,
    isLoading: ticketLoading,
    isError:   ticketError,
    error:     ticketErr,
    refetch:   refetchTicket,
  } = useQuery({
    queryKey:             ticketKeys.detail(id),
    queryFn:              () => ticketService.getById(id),
    initialData:          preloaded,
    initialDataUpdatedAt: preloaded ? Date.now() : undefined,
    staleTime:            30_000,
    retry:                2,
    retryDelay:           (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  // ── Comments query ────────────────────────────────────────────────────────────
  // enabled: syncDone          → waits for CRM sync to finish before first fetch
  // refetchInterval            → polls DB every 30s, no CRM call involved
  // refetchIntervalInBackground → pauses polling when tab is not focused
  const commentsParams = { page: 1, page_size: COMMENTS_PAGE_SIZE };

  const {
    data:      commentsData,
    isLoading: commentsLoading,
    isError:   commentsError,
    error:     commentsErr,
    refetch:   refetchComments,
  } = useQuery({
    queryKey:                    ticketKeys.comments(id, commentsParams),
    queryFn:                     () => ticketService.getComments(id, commentsParams),
    enabled:                     syncDone,
    staleTime:                   20_000,
    refetchInterval:             POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    retry:                       2,
    retryDelay:                  (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  const comments     = commentsData?.items ?? [];
  const commentTotal = commentsData?.total  ?? 0;

  // ── Agents for edit modal ─────────────────────────────────────────────────────
  const { data: agentsData = {} } = useQuery({
    queryKey: ['agents', 'list', { page_size: 100 }],
    queryFn:  () => agentService.getAll({ page_size: 100 }),
    staleTime: 60_000,
  });
  const agents = agentsData.items ?? [];

  // ── Add comment mutation (optimistic) ─────────────────────────────────────────
  const addCommentMutation = useMutation({
    mutationFn: (text) => ticketService.addComment(id, { text }),

    onMutate: async (text) => {
      setAddCommentError(false);
      await queryClient.cancelQueries({ queryKey: ticketKeys.comments(id, commentsParams) });
      const previous = queryClient.getQueryData(ticketKeys.comments(id, commentsParams));

      queryClient.setQueryData(ticketKeys.comments(id, commentsParams), (old) => {
        const optimistic = {
          id:             `optimistic-${Date.now()}`,
          author_name:    'You',
          body:           text,
          crm_created_at: new Date().toISOString(),
          is_internal:    false,
          comment_type:   'note',
        };
        return old
          ? { ...old, items: [...(old.items ?? []), optimistic], total: (old.total ?? 0) + 1 }
          : { items: [optimistic], total: 1 };
      });

      return { previous };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.comments(id, commentsParams) });
    },

    onError: (err, _text, context) => {
      console.error('[TicketDetails] Add comment failed:', err);
      if (context?.previous) {
        queryClient.setQueryData(ticketKeys.comments(id, commentsParams), context.previous);
      }
      setAddCommentError(true);
    },
  });

  const handleComment = () => {
    const text = comment.trim();
    if (!text || addCommentMutation.isPending) return;
    setComment('');
    addCommentMutation.mutate(text);
  };

  // ── Update ticket from EditModal ──────────────────────────────────────────────
  const handleUpdateTicket = (updatedTicket) => {
    setShowEditModal(false);
    queryClient.setQueryData(ticketKeys.detail(id), updatedTicket);
  };

  // ── Derived values ────────────────────────────────────────────────────────────
  const assignee     = ticket?.assignee ?? {};
  const assigneeName = assignee.name || '—';
  const customer     = ticket?.customer ?? {};
  const customerName = customer.name
    || `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
    || '—';

  const commentsReady = syncDone && !commentsLoading && !!commentsData;
  const showSkeleton  = !syncDone || (syncDone && commentsLoading && !commentsData);

  // ── Ticket loading ────────────────────────────────────────────────────────────
  if (ticketLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, gap: 12 }}>
      <Spinner size={28} color="var(--primary)" />
      <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading ticket…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Ticket error ──────────────────────────────────────────────────────────────
  if (ticketError && !ticket) return (
    <div style={{ maxWidth: 560, margin: '40px auto' }}>
      <div style={{
        background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius)',
        padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 12, textAlign: 'center',
      }}>
        <AlertTriangle size={32} color="#DC2626" />
        <div style={{ fontWeight: 600, fontSize: 15, color: '#DC2626' }}>
          {getErrorMessage(ticketErr, 'Could not load ticket.')}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate(backPath)}>
            <ArrowLeft size={15} /> Back to tickets
          </button>
          <button className="btn btn-primary" onClick={() => refetchTicket()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    </div>
  );

  if (!ticket) return null;

  return (
    <div style={{
      margin: '0 auto',
      width: '100%',
      maxWidth: 1280,
      padding: '0 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>

      {/* Global keyframes */}
      <style>{`
        @keyframes spin           { to { transform: rotate(360deg); } }
        @keyframes pulse          { 0%, 100% { opacity: 1 } 50% { opacity: 0.45 } }
        @keyframes commentsFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn         { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 1024px) {
          .ticket-details-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Back / breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate(backPath)} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          <span
            onClick={() => navigate(backPath)}
            style={{ cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {isAgent ? 'My Tickets' : 'Tickets'}
          </span>
          {ticket.title && <> › <span>{ticket.title}</span></>}
        </span>
      </div>

      <div
        className="ticket-details-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) clamp(240px, 22vw, 300px)',
          gap: 16,
          alignItems: 'start',
        }}
      >

        {/* ── Left: ticket + comments ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Ticket header */}
          <div className="card animate-in" style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className={statusBadgeClass(ticket.status)}>{ticket.status}</span>
                <span className={priorityBadgeClass(ticket.priority)}>{ticket.priority}</span>
                <span className={crmBadgeClass(ticket.crm)}>{ticket.crm}</span>
              </div>
              <button
                className="btn btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                onClick={() => setShowEditModal(true)}
              >
                <Pencil size={16} /> Edit
              </button>
            </div>

            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{ticket.title}</h1>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
              {ticket.created ? `Created ${formatDateTime(ticket.created)}` : ''}
            </div>

            {ticket.description ? (
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: 14.5 }}>
                {ticket.description}
              </p>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14 }}>
                No description provided.
              </p>
            )}
          </div>

          {/* Comments card */}
          <div className="card animate-in" style={{ padding: 24, animationDelay: '0.05s' }}>

            {/* Header: title + live sync indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={17} />
                Comments
                {commentsReady && (
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({commentTotal})</span>
                )}
              </h3>
              {syncing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-muted)' }}>
                  <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                  Syncing…
                </div>
              )}
            </div>

            {/* CRM sync warning */}
            {syncError && <SyncWarningBanner onRetry={() => runSync(true)} syncing={syncing} />}

            {/* Comments area */}
            <div style={{ minHeight: showSkeleton ? 160 : 0, transition: 'min-height 0.3s ease' }}>

              {showSkeleton && !commentsError && <CommentSkeleton />}

              {commentsError && !commentsLoading && (
                <CommentErrorBanner
                  message={getErrorMessage(commentsErr, 'Could not load comments.')}
                  onRetry={() => refetchComments()}
                />
              )}

              {commentsReady && !commentsError && comments.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '24px 0',
                  color: 'var(--text-muted)', fontSize: 13.5,
                  animation: 'commentsFadeIn 0.25s ease',
                }}>
                  No comments yet. Be the first to add one.
                </div>
              )}

              {commentsReady && comments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20, animation: 'commentsFadeIn 0.3s ease' }}>
                  {comments.map(c => {
                    const isOptimistic = String(c.id).startsWith('optimistic');
                    return (
                      <div key={c.id} style={{ display: 'flex', gap: 12, opacity: isOptimistic ? 0.65 : 1, transition: 'opacity 0.2s' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: getAvatarColor(c.author_name),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: 'white',
                        }}>
                          {getInitials(c.author_name)}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: 13.5 }}>{c.author_name}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {c.crm_created_at ? formatDateTime(c.crm_created_at) : 'Just now'}
                            </span>
                            {c.is_internal && (
                              <span style={{
                                fontSize: 10.5, fontWeight: 600, padding: '1px 6px',
                                borderRadius: 999, background: '#FEF9C3',
                                color: '#713F12', border: '1px solid #FDE047',
                              }}>
                                Internal
                              </span>
                            )}
                            {isOptimistic && (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Sending…
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              background: 'var(--surface-2)', padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)', fontSize: 13.5,
                              lineHeight: 1.65, color: 'var(--text-secondary)',
                            }}
                            dangerouslySetInnerHTML={{ __html: sanitise(c.body) }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Comment input */}
            <div style={{
              borderTop: commentsReady && comments.length > 0 ? '1px solid var(--border-light)' : 'none',
              paddingTop: commentsReady && comments.length > 0 ? 16 : 0,
            }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <textarea
                  className="form-input"
                  style={{ flex: 1, resize: 'vertical', minHeight: 80 }}
                  placeholder="Add a comment… (Ctrl+Enter to send)"
                  value={comment}
                  disabled={addCommentMutation.isPending}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleComment(); }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleComment}
                  disabled={addCommentMutation.isPending || !comment.trim()}
                  style={{ alignSelf: 'flex-end', padding: '10px 14px' }}
                  title="Send (Ctrl+Enter)"
                >
                  {addCommentMutation.isPending ? <Spinner /> : <Send size={16} />}
                </button>
              </div>

              {addCommentError && (
                <AddCommentErrorBanner onDismiss={() => setAddCommentError(false)} />
              )}
            </div>
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div
          className="card animate-in"
          style={{
            padding: '16px',
            animationDelay: '0.08s',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            background: 'linear-gradient(135deg, var(--surface) 0%, rgba(99, 102, 241, 0.02) 100%)',
          }}
        >
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--primary)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Details
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <DetailRow icon={User} label="Raised By">
              <HoverPopup popup={
                <PersonPopup name={customerName} email={customer.email} phone={customer.phone}
                  extra={customer.account ? `Account: ${customer.account}` : null} />
              }>
                <Chip
                  onClick={() => customer.id && navigate(`${base}/customers/${customer.id}`)}
                  avatarName={customerName} label={customerName} linkable={!!customer.id}
                />
              </HoverPopup>
            </DetailRow>

            <DetailRow icon={User} label="Assignee">
              <HoverPopup popup={
                <PersonPopup name={assigneeName} email={assignee.email} role={assignee.role || 'Agent'} />
              }>
                <Chip
                  onClick={() => assignee.id && navigate(`${base}/users/${assignee.id}`)}
                  avatarName={assigneeName} label={assigneeName} linkable={!!assignee.id}
                />
              </HoverPopup>
            </DetailRow>

            <DetailRow icon={Database} label="Source CRM">
              <HoverPopup popup={<CrmPopup crm={ticket.crm} />}>
                <span
                  className={crmBadgeClass(ticket.crm)}
                  style={{ cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {ticket.crm}
                </span>
              </HoverPopup>
            </DetailRow>

            <DetailRow icon={Calendar} label="Created">
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {formatDateTime(ticket.created) || '—'}
              </span>
            </DetailRow>

            <DetailRow icon={Clock} label="Last Updated">
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {formatDateTime(ticket.updated) || '—'}
              </span>
            </DetailRow>
          </div>
        </div>
      </div>

      <EditTicketModal
        ticket={ticket}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={handleUpdateTicket}
        agents={agents}
      />
    </div>
  );
}