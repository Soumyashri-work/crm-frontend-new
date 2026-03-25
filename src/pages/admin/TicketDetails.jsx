import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, User, Building2, Database, Clock,
  Calendar, Mail, Phone, ExternalLink, AlertTriangle,
  MessageCircle, Send,
} from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import {
  statusBadgeClass, priorityBadgeClass, crmBadgeClass,
  formatDateTime, getInitials, getAvatarColor,
} from '../../utils/helpers';

// ── Hover Popup ──────────────────────────────────────────────────────────────
function HoverPopup({ children, popup }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos]         = useState({ top: 0, left: 0 });
  const ref      = useRef();
  const timerRef = useRef();

  const show = () => {
    clearTimeout(timerRef.current);
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 8, left: rect.left });
    setVisible(true);
  };
  const hide = () => { timerRef.current = setTimeout(() => setVisible(false), 120); };

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

// ── Popup contents ────────────────────────────────────────────────────────────
function PersonPopup({ name, email, role, phone, extra }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: getAvatarColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
          {getInitials(name)}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{name}</div>
          {role && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{role}</div>}
        </div>
      </div>
      {email && (
        <a href={`mailto:${email}`} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--primary)', marginBottom: 6, textDecoration: 'none' }}>
          <Mail size={13} /> {email}
        </a>
      )}
      {phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 6 }}>
          <Phone size={13} /> {phone}
        </div>
      )}
      {extra && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{extra}</div>}
    </div>
  );
}

function AccountPopup({ name, email, phone, crm, tickets }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
          {getInitials(name)}
        </div>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{name}</div>
      </div>
      {email && (
        <a href={`mailto:${email}`} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--primary)', marginBottom: 6, textDecoration: 'none' }}>
          <Mail size={13} /> {email}
        </a>
      )}
      {phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 6 }}>
          <Phone size={13} /> {phone}
        </div>
      )}
      {crm && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-muted)' }}>
          <Database size={12} /> {crm}{tickets != null ? ` · ${tickets} tickets` : ''}
        </div>
      )}
    </div>
  );
}

function CrmPopup({ crm }) {
  const info = {
    EspoCRM: { desc: 'Open-source CRM platform',    color: '#7C3AED', bg: '#F3E8FF' },
    Zammad:  { desc: 'Help desk & ticketing system', color: '#059669', bg: '#ECFDF5' },
  };
  const d = info[crm] || { desc: 'CRM source', color: 'var(--primary)', bg: 'var(--primary-light)' };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: d.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

// ── Detail Row ────────────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 5 }}>
        <Icon size={11} /> {label}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{children}</div>
    </div>
  );
}

// ── Clickable chip ────────────────────────────────────────────────────────────
function Chip({ onClick, avatarName, label, icon, linkable }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '4px 8px', borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-2)',
        cursor: linkable ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
    >
      {avatarName && (
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: getAvatarColor(avatarName),
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function TicketDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isAgent  = location.pathname.startsWith('/agent');
  const base     = isAgent ? '/agent' : '/admin';
  const backPath = isAgent ? `${base}/my-tickets` : `${base}/tickets`;

  // Preloaded from TicketTable navigation state (skips redundant fetch)
  const preloaded = location.state?.ticket ?? null;

  const [ticket, setTicket]   = useState(preloaded);
  const [loading, setLoading] = useState(!preloaded);
  const [error, setError]     = useState(null);

  // ── Comments state ────────────────────────────────────────────────────────
  const [comments, setComments]               = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError]     = useState(null);
  const [commentTotal, setCommentTotal]       = useState(0);
  const [comment, setComment]                 = useState('');
  const [submitting, setSubmitting]           = useState(false);

  // ── Fetch ticket ──────────────────────────────────────────────────────────
  const fetchTicket = useCallback(() => {
    setLoading(true);
    setError(null);
    ticketService.getById(id)
      .then(data => setTicket(data))
      .catch(err => {
        console.error('Failed to load ticket:', err);
        setError('Could not load ticket. It may not exist or the server is unavailable.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── Fetch comments ────────────────────────────────────────────────────────
  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const data = await ticketService.getComments(id, { page: 1, page_size: 50 });
      setComments(data.items ?? []);
      setCommentTotal(data.total ?? 0);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setCommentsError('Could not load comments.');
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!preloaded) fetchTicket();
    fetchComments();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit comment ────────────────────────────────────────────────────────
  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await ticketService.addComment(id, { text: comment });
      setComment('');
      fetchComments();
    } catch (err) {
      console.error('Failed to add comment:', err);
      // Optimistic fallback
      setComments(prev => [...prev, {
        id:             Date.now(),
        author_name:    'You',
        body:           comment,
        crm_created_at: new Date().toISOString(),
        is_internal:    false,
        comment_type:   'note',
      }]);
      setCommentTotal(t => t + 1);
      setComment('');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ maxWidth: 560, margin: '40px auto' }}>
      <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <AlertTriangle size={32} color="#DC2626" />
        <div style={{ fontWeight: 600, fontSize: 15, color: '#DC2626' }}>{error}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate(backPath)}>
            <ArrowLeft size={15} /> Back to tickets
          </button>
          <button className="btn btn-primary" onClick={fetchTicket}>Retry</button>
        </div>
      </div>
    </div>
  );

  if (!ticket) return null;

  const assignee     = ticket.assignee ?? {};
  const assigneeName = assignee.name || '—';

  const customer     = ticket.customer ?? {};
  const customerName = customer.name
    || `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
    || '—';

  const account     = ticket.account ?? {};
  const accountName = account.name || account.company_name || '—';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Back / breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate(backPath)} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          <span
            onClick={() => navigate(backPath)}
            style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {isAgent ? 'My Tickets' : 'Tickets'}
          </span>
          {ticket.crm_id && <> › <span style={{ fontFamily: 'monospace' }}>{ticket.crm_id}</span></>}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* ── Left: main content + comments ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Ticket header card */}
          <div className="card animate-in" style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span className={statusBadgeClass(ticket.status)}>{ticket.status}</span>
              <span className={priorityBadgeClass(ticket.priority)}>{ticket.priority}</span>
              <span className={crmBadgeClass(ticket.crm)}>{ticket.crm}</span>
            </div>

            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{ticket.title}</h1>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
              {ticket.crm_id && <span style={{ fontFamily: 'monospace' }}>{ticket.crm_id}</span>}
              {ticket.created ? ` · Created ${formatDateTime(ticket.created)}` : ''}
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

          {/* ── Comments ── */}
          <div className="card animate-in" style={{ padding: 24, animationDelay: '0.05s' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={17} />
              Comments ({commentTotal})
            </h3>

            {/* Comments loading skeleton */}
            {commentsLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--border)', flexShrink: 0, animation: 'pulse 1.4s ease-in-out infinite' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ height: 12, width: '30%', borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                      <div style={{ height: 48, borderRadius: 6, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                    </div>
                  </div>
                ))}
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
              </div>
            )}

            {/* Comments error */}
            {commentsError && !commentsLoading && (
              <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontSize: 13, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{commentsError}</span>
                <button onClick={fetchComments} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }}>
                  Retry
                </button>
              </div>
            )}

            {/* Empty state */}
            {!commentsLoading && !commentsError && comments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13.5 }}>
                No comments yet. Be the first to add one.
              </div>
            )}

            {/* Comments list */}
            {!commentsLoading && comments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                {comments.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: 12 }}>

                    {/* Avatar */}
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: getAvatarColor(c.author_name),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: 'white',
                    }}>
                      {getInitials(c.author_name)}
                    </div>

                    <div style={{ flex: 1 }}>
                      {/* Author + timestamp + badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{c.author_name}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {formatDateTime(c.crm_created_at)}
                        </span>   
                      </div>

                      {/* Body — rendered as HTML since backend sends <br>, <div> tags */}
                      <div
                        style={{
                          background:    c.is_internal ? '#FDFDF0' : 'var(--surface-2)',
                          border:        c.is_internal ? '1px dashed #C8B900' : '1px solid transparent',
                          padding:       '10px 14px',
                          borderRadius:  'var(--radius-sm)',
                          fontSize:      13.5,
                          lineHeight:    1.65,
                          color:         'var(--text-secondary)',
                        }}
                        dangerouslySetInnerHTML={{ __html: c.body }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment input */}
            <div style={{
              display: 'flex', gap: 10,
              borderTop: comments.length > 0 ? '1px solid var(--border-light)' : 'none',
              paddingTop: comments.length > 0 ? 16 : 0,
            }}>
              <textarea
                className="form-input"
                style={{ flex: 1, resize: 'vertical', minHeight: 80 }}
                placeholder="Add a comment… (Ctrl+Enter to send)"
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleComment();
                }}
              />
              <button
                className="btn btn-primary"
                onClick={handleComment}
                disabled={submitting || !comment.trim()}
                style={{ alignSelf: 'flex-end', padding: '10px 14px' }}
                title="Send (Ctrl+Enter)"
              >
                {submitting
                  ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                  : <Send size={16} />
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: details sidebar ── */}
        <div className="card animate-in" style={{ padding: 20, animationDelay: '0.08s' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 18 }}>
            Details
          </div>

          <DetailRow icon={User} label="Raised By">
            <HoverPopup popup={
              <PersonPopup
                name={customerName}
                email={customer.email}
                phone={customer.phone}
                extra={customer.account ? `Account: ${customer.account}` : null}
              />
            }>
              <Chip
                onClick={() => customer.id && navigate(`${base}/customers/${customer.id}`)}
                avatarName={customerName}
                label={customerName}
                linkable={!!customer.id}
              />
            </HoverPopup>
          </DetailRow>

          <DetailRow icon={Building2} label="Account">
            <HoverPopup popup={
              <AccountPopup
                name={accountName}
                email={account.email}
                phone={account.phone}
                crm={account.crm}
                tickets={account.tickets}
              />
            }>
              <Chip
                onClick={() => account.id && navigate(`${base}/accounts/${account.id}`)}
                icon={<Building2 size={14} color="var(--primary)" />}
                label={accountName}
                linkable={!!account.id}
              />
            </HoverPopup>
          </DetailRow>

          <DetailRow icon={User} label="Assignee">
            <HoverPopup popup={
              <PersonPopup
                name={assigneeName}
                email={assignee.email}
                role={assignee.role || 'Agent'}
              />
            }>
              <Chip
                onClick={() => assignee.id && navigate(`${base}/users/${assignee.id}`)}
                avatarName={assigneeName}
                label={assigneeName}
                linkable={!!assignee.id}
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

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 16px' }} />

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
  );
}