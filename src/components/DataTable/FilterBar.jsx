/**
 * src/components/DataTable/FilterBar.jsx
 *
 * Reusable filter toolbar with search bar and optional filter dropdowns.
 *
 * Props:
 *   search              string                  — Current search query
 *   onSearchChange      (value) => void         — Search input change handler
 *   filters             { [key]: value }        — Current filter values
 *   onFilterChange      (key, value) => void    — Filter dropdown change handler
 *   filterOptions       [{ key, label, options: [...] }]  — Filter definitions
 *   hasActiveFilters    boolean                 — Show clear filters button?
 *   onClearFilters      () => void              — Clear filters handler
 *   searchPlaceholder   string                  — Optional search placeholder
 */

import { Search, ChevronDown, X } from 'lucide-react';

export default function FilterBar({
  search = '',
  onSearchChange = () => {},
  filters = {},
  onFilterChange = () => {},
  filterOptions = [],
  hasActiveFilters = false,
  onClearFilters = () => {},
  searchPlaceholder = 'Search…',
}) {
  return (
    <div className="filter-toolbar">
      {/* Search full-width */}
      <div className="filter-search-row">
        <Search size={16} className="filter-search-icon" />
        <input
          className="filter-search-input"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filters row + clear button */}
      {filterOptions.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            paddingTop: 12,
            borderTop: '1px solid var(--border-light)',
          }}
        >
          {filterOptions.map((filter) => (
            <div key={filter.key} style={{ position: 'relative' }}>
              <select
                value={filters[filter.key] || ''}
                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                style={{
                  padding: '8px 32px 8px 12px',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'white',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  cursor: 'pointer',
                  appearance: 'none',
                  fontFamily: 'inherit',
                }}
              >
                <option value="">{filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--text-muted)',
                }}
              />
            </div>
          ))}

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: '1px solid var(--border-light)',
                color: 'var(--text-secondary)',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={12} />
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}