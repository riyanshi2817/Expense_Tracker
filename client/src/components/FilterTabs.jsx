const filters = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'unused', label: 'Unused' },
]

function FilterTabs({ value, onChange }) {
  return (
    <div className="filter-tabs" role="group" aria-label="Filter subscriptions">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          aria-pressed={value === filter.value}
          onClick={() => onChange(filter.value)}
          className={`filter-tab${value === filter.value ? ' is-active' : ''}`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

export default FilterTabs
