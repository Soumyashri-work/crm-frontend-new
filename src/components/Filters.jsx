import { ChevronDown, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { tenantService, tenantKeys } from '../services/tenantService';

function FilterSelect({ label, options, value, onChange, disabled = false }) {
  const active = !!value;
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          appearance: 'none',
          padding: '8px 32px 8px 12px',
          border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
          background: active ? 'var(--primary-light)' : disabled ? 'var(--surface-2)' : 'var(--surface)',
          fontSize: 13.5,
          color: active ? 'var(--primary)' : disabled ? 'var(--text-muted)' : 'var(--text-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          fontFamily: 'inherit',
          fontWeight: active ? 600 : 500,
          minWidth: 130,
          transition: 'all 0.15s',
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <option value="">{label}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} style={{
        position: 'absolute', right: 10, top: '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none',
        color: active ? 'var(--primary)' : 'var(--text-muted)',
      }} />
    </div>
  );
}

export default function Filters({ filters, onChange, extraFilters = [] }) {
  // ── Fetch dynamic CRM sources scoped to this tenant ──
  const { data: sourceSystems = [], isLoading: isCrmLoading } = useQuery({
    queryKey: tenantKeys.sourceSystems(),
    queryFn: () => tenantService.getSourceSystems(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes globally
  });

  // Map the backend DB values into the { value, label } shape
  const dynamicCrmOpts = sourceSystems.map(system => {
    // e.g., "espocrm" -> "Espocrm", "zammad" -> "Zammad"
    // Adjust capitalization logic here if you want specific branding like "EspoCRM"
    const label = system.system_name.toLowerCase() === 'espocrm' 
      ? 'EspoCRM' 
      : system.system_name.charAt(0).toUpperCase() + system.system_name.slice(1);
    
    return {
      value: system.system_name,
      label: label
    };
  });

  const statusOpts = [
    { value: 'open',    label: 'Open'        },
    { value: 'closed',  label: 'Closed'      },
    { value: 'pending', label: 'Pending'     },
  ];

  const priorityOpts = [
    { value: 'urgent', label: 'Urgent' },
    { value: 'high',   label: 'High'   },
    { value: 'normal', label: 'Normal' },
    { value: 'low',    label: 'Low'    },
  ];

  const hasActiveFilters = filters.status || filters.priority || filters.crm ||
    extraFilters.some(f => filters[f.key]);

  const clearAll = () => {
    const cleared = { ...filters };
    delete cleared.status;
    delete cleared.priority;
    delete cleared.crm;
    extraFilters.forEach(f => delete cleared[f.key]);
    onChange(cleared);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
      <FilterSelect
        label="All Status"
        options={statusOpts}
        value={filters.status || ''}
        onChange={v => onChange({ ...filters, status: v || undefined })}
      />
      <FilterSelect
        label="All Priorities"
        options={priorityOpts}
        value={filters.priority || ''}
        onChange={v => onChange({ ...filters, priority: v || undefined })}
      />
      
      {/* ── Now driven entirely by the database ── */}
      <FilterSelect
        label={isCrmLoading ? 'Loading CRMs...' : 'All CRM Sources'}
        options={dynamicCrmOpts}
        value={filters.crm || ''}
        disabled={isCrmLoading}
        onChange={v => onChange({ ...filters, crm: v || undefined })}
      />
      
      {extraFilters.map(f => (
        <FilterSelect
          key={f.key} label={f.label} options={f.options}
          value={filters[f.key] || ''}
          onChange={v => onChange({ ...filters, [f.key]: v || undefined })}
        />
      ))}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 12px', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', background: 'none',
            cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <X size={13} /> Clear filters
        </button>
      )}
    </div>
  );
}