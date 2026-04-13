/**
 * components/Filters.jsx
 *
 * Unified filter toolbar used across Tickets pages.
 * Layout: full-width search on top, dropdowns aligned left below.
 * Matches the strict design template with outlined dropdowns + chevron icons.
 */

import { Search, ChevronDown } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '',           label: 'All' },
  { value: 'open',       label: 'Open' },
  { value: 'closed',     label: 'Closed' },
  { value: 'pending',    label: 'Pending' },
  { value: 'in_progress',label: 'In Progress' },
];

const PRIORITY_OPTIONS = [
  { value: '',       label: 'All' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high',   label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low',    label: 'Low' },
];

const SOURCE_OPTIONS = [
  { value: '',        label: 'All' },
  { value: 'EspoCRM', label: 'EspoCRM' },
  { value: 'Zammad',  label: 'Zammad' },
];

/**
 * Props:
 *   filters   – { status?, priority?, source_system? }
 *   onChange  – (newFilters) => void
 *   search    – string (optional, if parent manages search)
 *   onSearch  – (val: string) => void (optional)
 *   placeholder – string (optional, page-specific search placeholder)
 */
export default function Filters({
  filters = {},
  onChange,
  search,
  onSearch,
  placeholder = 'Search…',
}) {
  const set = (key, val) => onChange({ ...filters, [key]: val || undefined });

  return (
    <div className="filter-toolbar">
      {/* ── Top row: full-width search ── */}
      {onSearch !== undefined && (
        <div className="filter-search-row">
          <Search size={16} className="filter-search-icon" />
          <input
            className="filter-search-input"
            placeholder={placeholder}
            value={search ?? ''}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
      )}

      {/* ── Bottom row: dropdowns ── */}
      <div className="filter-dropdowns-row">

        {/* Status */}
        <div className="filter-select-wrap">
          <select
            className={`filter-select${filters.status ? ' active' : ''}`}
            value={filters.status ?? ''}
            onChange={e => set('status', e.target.value)}
          >
            <option value="" disabled hidden>Status</option>
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.value === '' ? 'Status: All' : o.label}
              </option>
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
            <option value="" disabled hidden>Priority</option>
            {PRIORITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.value === '' ? 'Priority: All' : o.label}
              </option>
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
            <option value="" disabled hidden>Source CRM</option>
            {SOURCE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.value === '' ? 'Source CRM: All' : o.label}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="filter-chevron" />
        </div>

        {/* Clear button — only when active */}
        {(filters.status || filters.priority || filters.source_system) && (
          <button
            onClick={() => onChange({})}
            style={{
              padding: '8px 12px',
              border: '1.5px solid var(--border-dark)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 12.5,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
