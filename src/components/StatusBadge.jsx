import React from 'react';
import '../styles/global.css';

const StatusBadge = ({ status }) => {
  const statusClass = {
    active: 'badge-active',
    inactive: 'badge-inactive',
    pending: 'badge-pending'
  }[status.toLowerCase()];

  return (
    <span className={`status-badge ${statusClass}`}>
      <span className="status-dot"></span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default StatusBadge;
