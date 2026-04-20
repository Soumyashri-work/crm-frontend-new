import { useState } from 'react';
import { crmBadgeClass, displayCrmBadges } from '../utils/helpers';

export default function CrmBadgesDisplay({ crms = [], maxDisplay = 2 }) {
  const [showAll, setShowAll] = useState(false);
  const { visible, hidden, hasMore } = displayCrmBadges(crms, maxDisplay);

  if (crms.length === 0) {
    return <span className="text-muted text-sm">—</span>;
  }

  if (showAll) {
    return (
      <div className="flex-wrap">
        {crms.map((crm) => (
          <span key={crm} className={crmBadgeClass(crm)}>
            {crm}
          </span>
        ))}
        <button
          onClick={() => setShowAll(false)}
          className="crm-toggle-btn"
        >
          Less
        </button>
      </div>
    );
  }

  return (
    <div className="flex-wrap">
      {visible.map((crm) => (
        <span key={crm} className={crmBadgeClass(crm)}>
          {crm}
        </span>
      ))}
      {hasMore && (
        <button
          onClick={() => setShowAll(true)}
          className="crm-expand-btn"
        >
          +{hidden.length} more
        </button>
      )}
    </div>
  );
}