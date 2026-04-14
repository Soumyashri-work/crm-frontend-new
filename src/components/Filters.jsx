/**
 * components/Filters.jsx
 *
 * Reusable filter toolbar used on Tickets and MyTickets pages.
 * Layout: full-width search on top, outlined dropdowns row below.
 *
 * Props:
 *   filters     { status?, priority?, source_system? }
 *   onChange    (newFilters) => void
 */
import { ChevronDown } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'open',        label: 'Open' },
  { value: 'closed',      label: 'Closed' },
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
];

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high',   label: 'High'   },
  { value: 'normal', label: 'Normal' },
  { value: 'low',    label: 'Low'    },
];

const SOURCE_OPTIONS = [
  { value: 'EspoCRM', label: 'EspoCRM' },
  { value: 'Zammad',  label: 'Zammad'  },
];

export default function Filters({ filters = {}, onChange }) {
  const set = (key, val) => onChange({ ...filters, [key]: val || undefined });
  const hasActive = filters.status || filters.priority || filters.source_system;

  return (
    <div className="filter-dropdowns-row">

      {/* Status */}
      <div className="filter-select-wrap">
        <select
          className={`filter-select${filters.status ? ' active' : ''}`}
          value={filters.status ?? ''}
          onChange={e => set('status', e.target.value)}
        >
          <option value="">Status: All</option>
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={13} className="filter-chevron" />
      </div>

      {/* Priority */}
      <div className="filter-select-wrap">
        <select
          className={`filter-select${filters.priority ? ' active' : ''}`}
          value={filters.priority ?? ''}
          onChange={e => set('priority', e.target.value)}
        >
          <option value="">Priority: All</option>
          {PRIORITY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={13} className="filter-chevron" />
      </div>

      {/* Source CRM */}
      <div className="filter-select-wrap">
        <select
          className={`filter-select${filters.source_system ? ' active' : ''}`}
          value={filters.source_system ?? ''}
          onChange={e => set('source_system', e.target.value)}
        >
          <option value="">Source CRM: All</option>
          {SOURCE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={13} className="filter-chevron" />
      </div>

      {/* Clear */}
      {hasActive && (
        <button className="filter-clear-btn" onClick={() => onChange({})}>
          Clear Filters
        </button>
      )}
    </div>
  );
}
