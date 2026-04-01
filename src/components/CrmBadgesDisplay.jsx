import { useState } from 'react';
import { X } from 'lucide-react';
import { crmBadgeClass, displayCrmBadges } from '../utils/helpers';

export default function CrmBadgesDisplay({ crms = [], maxDisplay = 2 }) {
  const [showAll, setShowAll] = useState(false);
  const { visible, hidden, hasMore } = displayCrmBadges(crms, maxDisplay);

  if (crms.length === 0) {
    return <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>;
  }

  if (showAll) {
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {crms.map((crm) => (
          <span key={crm} className={crmBadgeClass(crm)}>
            {crm}
          </span>
        ))}
        <button
          onClick={() => setShowAll(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'var(--text-muted)',
            fontSize: 12,
            textDecoration: 'underline',
            fontFamily: 'inherit',
          }}
        >
          Less
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {visible.map((crm) => (
        <span key={crm} className={crmBadgeClass(crm)}>
          {crm}
        </span>
      ))}
      {hasMore && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '99px',
            padding: '2px 8px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--surface-2)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          +{hidden.length} more
        </button>
      )}
    </div>
  );
}
