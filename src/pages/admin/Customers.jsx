/**
 * src/pages/admin/Customers.jsx
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerService, customerKeys } from '../../services/customerService';
import { tenantService, tenantKeys } from '../../services/tenantService';
import { getInitials, getAvatarColor, crmBadgeClass } from '../../utils/helpers';
import { DataTable } from '../../components/DataTable';
import { PAGE_SIZE } from '../../constants/pagination';

export default function Customers() {
  const [search, setSearch]           = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortField, setSortField]     = useState('');
  const [sortDir, setSortDir]         = useState('asc');
  const [page, setPage]               = useState(1);

  // ─── Source systems ───────────────────────────────────────────────────────
  const { data: sourceSystems = [] } = useQuery({
    queryKey: tenantKeys.sourceSystems(),
    queryFn:  () => tenantService.getSourceSystems(),
    staleTime: 5 * 60 * 1000,
  });

  // ─── Customers ────────────────────────────────────────────────────────────
  const queryParams = {
    page,
    page_size: PAGE_SIZE.DEFAULT,
    ...(sourceFilter ? { source_system: sourceFilter } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey:        customerKeys.list(queryParams),
    queryFn:         () => customerService.getAll(queryParams),
    placeholderData: (prev) => prev,
    staleTime:       30_000,
  });

  const customers = data?.items ?? [];

  // ─── Client-side filtering ────────────────────────────────────────────────
  // Apply BOTH search AND sourceFilter client-side so the table always
  // reflects the selected filters even while a new fetch is in-flight or
  // when placeholderData from the previous query is being shown.
  const filtered = customers.filter((c) => {
    // Source system filter — compare case-insensitively against c.crm
    if (sourceFilter) {
      const crm = (c.crm ?? c.source_system ?? '').toLowerCase();
      if (!crm.includes(sourceFilter.toLowerCase())) return false;
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const matchesName  = c.name?.toLowerCase().includes(q);
      const matchesEmail = c.email?.toLowerCase().includes(q);
      const matchesCrm   = c.crm?.toLowerCase().includes(q);
      if (!matchesName && !matchesEmail && !matchesCrm) return false;
    }

    return true;
  });

  // ─── Client-side sort ─────────────────────────────────────────────────────
  const sorted = sortField
    ? [...filtered].sort((a, b) => {
        const av = String(a[sortField] ?? '').toLowerCase();
        const bv = String(b[sortField] ?? '').toLowerCase();
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ?  1 : -1;
        return 0;
      })
    : filtered;

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  // ─── Columns ──────────────────────────────────────────────────────────────
  const columns = [
    {
      key:      'name',
      label:    'Name',
      sortable: true,
      width:    '25%',
      render: (value, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: getAvatarColor(row.name),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {getInitials(row.name)}
          </div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.name}</div>
        </div>
      ),
    },
    {
      key:      'email',
      label:    'Email',
      sortable: true,
      width:    '25%',
      render: (value) => (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{value || '—'}</div>
      ),
    },
    {
      key:      'phone',
      label:    'Phone',
      sortable: false,
      width:    '20%',
      render: (value) => (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{value || '—'}</div>
      ),
    },
    {
      key:      'crm',
      label:    'CRM',
      sortable: true,
      width:    '20%',
      render: (value) =>
        value
          ? <span className={crmBadgeClass(value)}>{value}</span>
          : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>,
    },
  ];

  // ─── Filter options ───────────────────────────────────────────────────────
  const filterOptions = [
    {
      key:     'source_system',
      label:   'Filter by CRM',
      options: sourceSystems.map((s) => ({
        value: typeof s === 'string' ? s : s.system_name,
        label: typeof s === 'string' ? s : s.system_name,
      })),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>
          <a href="/admin/dashboard" style={{ color: 'var(--text-muted)' }}>Dashboard</a>
          <span style={{ margin: '0 5px' }}>›</span>
          <span style={{ color: 'var(--text-secondary)' }}>Customers</span>
        </div>
        <h1>Customers</h1>
      </div>

      <DataTable
        columns={columns}
        data={sorted}
        pageSize={PAGE_SIZE.DEFAULT}
        currentPage={page}
        onPageChange={setPage}
        loading={isLoading}
        error={isError ? error?.message ?? 'Failed to load customers.' : null}
        onRetry={refetch}
        searchValue={search}
        onSearchChange={setSearch}
        filters={{ source_system: sourceFilter }}
        onFilterChange={(key, value) => {
          if (key === 'source_system') setSourceFilter(value);
          setPage(1);
        }}
        filterOptions={filterOptions}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
        searchPlaceholder="Search by name, email or CRM…"
        emptyMessage={
          search || sourceFilter
            ? 'No customers match your filters.'
            : 'No customers found.'
        }
      />
    </div>
  );
}