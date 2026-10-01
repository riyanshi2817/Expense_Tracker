const filters = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'unused', label: 'Unused' },
]

function FilterTabs({ value, onChange }) {
  return (
    <div className="inline-flex rounded-2xl border border-border bg-surface-elevated p-1" role="tablist" aria-label="Filter subscriptions">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          role="tab"
          aria-selected={value === filter.value}
          onClick={() => onChange(filter.value)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            value === filter.value
              ? 'bg-accent text-ink'
              : 'text-ink-secondary hover:text-ink'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

export default FilterTabs
