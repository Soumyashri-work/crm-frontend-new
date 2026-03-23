import { ChevronDown, X } from 'lucide-react';

function FilterSelect({ label, options, value, onChange }) {
  const active = !!value;
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none',
          padding: '8px 32px 8px 12px',
          border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
          background: active ? 'var(--primary-light)' : 'var(--surface)',
          fontSize: 13.5,
          color: active ? 'var(--primary)' : 'var(--text-primary)',
          cursor: 'pointer',
          outline: 'none',
          fontFamily: 'inherit',
          fontWeight: active ? 600 : 500,
          minWidth: 130,
          transition: 'all 0.15s',
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

const crmOpts = [
  { value: 'espocrm', label: 'EspoCRM' },
  { value: 'zammad',  label: 'Zammad'  },
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
      <FilterSelect
        label="All CRM Sources"
        options={crmOpts}
        value={filters.crm || ''}
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
