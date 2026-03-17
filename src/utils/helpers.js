export function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getAvatarColor(name) {
  const colors = ['#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0891B2','#65A30D'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
}

export function statusBadgeClass(status) {
  const map = {
    open: 'badge-open',
    closed: 'badge-closed',
    pending: 'badge-pending',
    'in progress': 'badge-inprogress',
    inprogress: 'badge-inprogress',
  };
  return 'badge ' + (map[status?.toLowerCase()] || 'badge-open');
}

export function priorityBadgeClass(priority) {
  const map = {
    urgent: 'badge-urgent',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  };
  return 'badge ' + (map[priority?.toLowerCase()] || 'badge-medium');
}

export function crmBadgeClass(crm) {
  if (!crm) return 'badge';
  return 'badge ' + (crm.toLowerCase().includes('espo') ? 'badge-espocrm' : 'badge-zammad');
}

export function truncate(str, n = 40) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}
