/**
 * src/components/DataTable/DataTable.jsx
 *
 * Unified table component for list pages across admin, agent, and superadmin roles.
 * Handles search, sort, filtering, pagination, and row selection.
 *
 * Props:
 *   columns             [{key, label, width?, render?, sortable?}]  — Table columns
 *   data                Array                       — Data to display
 *   loading             boolean                     — Loading state
 *   error               string | null               — Error message
 *   onRetry             () => void                  — Retry handler
 *   pagination          {total, total_pages, page}  — Pagination info
 *   onPageChange        (page) => void              — Page change handler
 *   searchValue         string                      — Current search query
 *   onSearchChange      (value) => void             — Search change handler
 *   filters             { [key]: value }            — Current filters
 *   onFilterChange      (key, value) => void        — Filter change handler
 *   filterOptions       [{key, label, options}]     — Filter definitions
 *   onSort              (field) => void             — Sort handler
 *   sortField           string                      — Current sort field
 *   sortDir             'asc'|'desc'                — Sort direction
 *   selectedRows        Set<id>                     — Selected row IDs
 *   onRowSelect         (rowId, selected) => void   — Row selection handler
 *   onSelectAll         (selected) => void          — Select all handler
 *   pageSize            number                      — Items per page (default 20)
 *   emptyMessage        string                      — Empty state message
 *   searchPlaceholder   string                      — Search input placeholder
 *   showCheckboxes      boolean                     — Show row checkboxes?
 *   onRowClick          (row) => void               — Row click handler (optional)
 */

import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import FilterBar from './FilterBar';

const SKELETON_ROWS = 6;

export default function DataTable({
  // Data
  columns = [],
  data = [],
  loading = false,
  error = null,
  onRetry = () => {},

  // Pagination
  pagination = { total: 0, total_pages: 1, page: 1 },
  onPageChange = () => {},
  pageSize = 20,

  // Search
  searchValue = '',
  onSearchChange = () => {},
  searchPlaceholder = 'Search…',

  // Filtering
  filters = {},
  onFilterChange = () => {},
  filterOptions = [],

  // Sorting
  onSort = () => {},
  sortField = '',
  sortDir = 'asc',

  // Row selection
  selectedRows = new Set(),
  onRowSelect = () => {},
  onSelectAll = () => {},
  showCheckboxes = false,

  // UI
  onRowClick = null,
  emptyMessage = 'No records found.',
}) {
  const hasActiveFilters = Boolean(
    searchValue || Object.values(filters).some((v) => v)
  );

  const handleClearFilters = () => {
    onSearchChange('');
    Object.keys(filters).forEach((key) => onFilterChange(key, ''));
  };

  const handleSort = (field) => {
    onSort(field);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown
          size={13}
          style={{ opacity: 0.35, marginLeft: 4 }}
        />
      );
    }
    return sortDir === 'asc' ? (
      <ArrowUp
        size={13}
        style={{ marginLeft: 4, color: 'var(--primary)' }}
      />
    ) : (
      <ArrowDown
        size={13}
        style={{ marginLeft: 4, color: 'var(--primary)' }}
      />
    );
  };

  const thSort = (field) => ({
    style: {
      cursor: 'pointer',
      userSelect: 'none',
      color: sortField === field ? 'var(--primary)' : undefined,
      background: sortField === field ? '#EFF6FF' : undefined,
    },
    onClick: () => handleSort(field),
  });

  const allSelected = data.length > 0 && data.every((d) => selectedRows.has(d.id));
  const someSelected = selectedRows.size > 0 && !allSelected;

  // ─── Loading skeleton ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="card" style={{ overflow: 'hidden' }}>
        {[...Array(SKELETON_ROWS)].map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 14,
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-light)',
              alignItems: 'center',
            }}
          >
            {showCheckboxes && (
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: 'var(--border)',
                  animation: 'pulse 1.4s ease-in-out infinite',
                  flexShrink: 0,
                }}
              />
            )}
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'var(--border)',
                animation: 'pulse 1.4s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div
                style={{
                  height: 13,
                  width: '45%',
                  borderRadius: 4,
                  background: 'var(--border)',
                  animation: 'pulse 1.4s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  height: 11,
                  width: '65%',
                  borderRadius: 4,
                  background: 'var(--border)',
                  animation: 'pulse 1.4s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        ))}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          color: '#B91C1C',
          fontSize: 13.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{error}</span>
        <button
          onClick={onRetry}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#B91C1C',
            fontWeight: 600,
            fontFamily: 'inherit',
            textDecoration: 'underline',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter bar */}
      <FilterBar
        search={searchValue}
        onSearchChange={onSearchChange}
        filters={filters}
        onFilterChange={onFilterChange}
        filterOptions={filterOptions}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        searchPlaceholder={searchPlaceholder}
      />

      {/* Table card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {showCheckboxes && (
                  <th style={{ width: 44, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={(e) => onSelectAll(e.target.checked)}
                      style={{
                        cursor: 'pointer',
                        width: 18,
                        height: 18,
                      }}
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      width: col.width,
                      ...(col.sortable ? thSort(col.key).style : {}),
                    }}
                    {...(col.sortable ? thSort(col.key) : {})}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          col.align === 'center' ? 'center' : 'flex-start',
                      }}
                    >
                      {col.label}
                      {col.sortable && <SortIcon field={col.key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (showCheckboxes ? 1 : 0)}
                    style={{
                      textAlign: 'center',
                      padding: '40px 0',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                    }}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      background: selectedRows.has(row.id)
                        ? '#EFF6FF'
                        : undefined,
                    }}
                    onClick={() => {
                      if (onRowClick) onRowClick(row);
                    }}
                  >
                    {showCheckboxes && (
                      <td style={{ textAlign: 'center', width: 44 }}>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={(e) =>
                            onRowSelect(row.id, e.target.checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            cursor: 'pointer',
                            width: 18,
                            height: 18,
                          }}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render
                          ? col.render(row[col.key], row)
                          : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
            color: 'var(--text-muted)',
          }}
        >
          <span>
            {pagination.total} record{pagination.total !== 1 ? 's' : ''} total
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() =>
                onPageChange(Math.max(1, pagination.page - 1))
              }
              disabled={pagination.page === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                background: 'white',
                cursor:
                  pagination.page === 1 ? 'not-allowed' : 'pointer',
                opacity: pagination.page === 1 ? 0.5 : 1,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <div
              style={{
                padding: '0 12px',
                fontSize: 12,
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              Page {pagination.page} of {pagination.total_pages}
            </div>

            <button
              onClick={() =>
                onPageChange(
                  Math.min(
                    pagination.total_pages,
                    pagination.page + 1
                  )
                )
              }
              disabled={pagination.page === pagination.total_pages}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                background: 'white',
                cursor:
                  pagination.page === pagination.total_pages
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  pagination.page === pagination.total_pages
                    ? 0.5
                    : 1,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}