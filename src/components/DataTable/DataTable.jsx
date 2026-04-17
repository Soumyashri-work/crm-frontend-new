/**
 * src/components/DataTable/DataTable.jsx
 *
 * UNIFIED TABLE COMPONENT with built-in pagination, search, filters, sort
 * 
 * Pagination is handled INTERNALLY by DataTable
 * Pages just pass: data, currentPage, onPageChange, pageSize
 *
 * Props:
 *   columns             [{key, label, width?, render?, sortable?}]
 *   data                Array  — ALL data (not sliced) — DataTable paginates internally
 *   pageSize            number — Items per page (default: 10)
 *   currentPage         number — Current page (1-indexed)
 *   onPageChange        (page) => void
 *   loading, error...   other UI state props
 */

import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import FilterBar from './FilterBar';

const SKELETON_ROWS = 6;

export default function DataTable({
  // Data & Pagination
  columns = [],
  data = [],
  pageSize = 10,
  currentPage = 1,
  onPageChange = () => {},

  // Loading & Error
  loading = false,
  error = null,
  onRetry = () => {},

  // Search
  searchValue = '',
  onSearchChange = () => {},
  searchPlaceholder = 'Search…',

  // Filters
  filters = {},
  onFilterChange = () => {},
  filterOptions = [],

  // Sort
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
  // ─── Calculate pagination internally ─────────────────────────────────
  const totalRecords = data.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  
  // Validate current page
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  
  // Slice data for current page
  const paginatedData = data.slice(
    (validPage - 1) * pageSize,
    validPage * pageSize
  );

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
      return <ArrowUpDown size={13} style={{ opacity: 0.35, marginLeft: 4 }} />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp size={13} style={{ marginLeft: 4, color: 'var(--primary)' }} />
    ) : (
      <ArrowDown size={13} style={{ marginLeft: 4, color: 'var(--primary)' }} />
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

  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((d) => selectedRows.has(d.id));
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
        {onRetry && (
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
        )}
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

      {/* Table card with pagination footer */}
      <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
                      ref={(el) => {
                        if (el)
                          el.indeterminate = someSelected;
                      }}
                      onChange={(e) => onSelectAll(e.target.checked)}
                      style={{ cursor: 'pointer', width: 18, height: 18 }}
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
                        justifyContent: col.align === 'center' ? 'center' : 'flex-start',
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
              {paginatedData.length === 0 ? (
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
                paginatedData.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    style={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      background: selectedRows.has(row.id) ? '#EFF6FF' : undefined,
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
                          onChange={(e) => onRowSelect(row.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'pointer', width: 18, height: 18 }}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer ─ Always shown when data exists */}
        {totalRecords > 0 && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              fontSize: 13,
              color: 'var(--text-muted)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              background: 'var(--surface)',
            }}
          >
            <span>
              {totalRecords} record{totalRecords !== 1 ? 's' : ''} total
              {totalPages > 1 && ` • Page ${validPage} of ${totalPages}`}
            </span>

            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => onPageChange(Math.max(1, validPage - 1))}
                  disabled={validPage === 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'white',
                    cursor: validPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: validPage === 1 ? 0.5 : 1,
                    fontSize: 13,
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (validPage > 1) {
                      e.currentTarget.style.background = 'var(--surface-2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>

                <button
                  onClick={() => onPageChange(Math.min(totalPages, validPage + 1))}
                  disabled={validPage === totalPages}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'white',
                    cursor: validPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: validPage === totalPages ? 0.5 : 1,
                    fontSize: 13,
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (validPage < totalPages) {
                      e.currentTarget.style.background = 'var(--surface-2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}