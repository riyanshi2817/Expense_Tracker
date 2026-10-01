import { EmptyState } from './Feedback'

const trendStyles = {
  up: { color: 'text-danger', background: 'bg-danger/10', symbol: '↗', label: 'Spending up' },
  down: { color: 'text-success', background: 'bg-success/10', symbol: '↘', label: 'Spending down' },
  stable: { color: 'text-ink-secondary', background: 'bg-surface-muted', symbol: '→', label: 'Stable' },
}

function CategoryTrends({ trends = [] }) {
  return (
    <section className="rounded-card border border-border bg-surface-elevated p-6 shadow-card lg:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-soft">Momentum</p>
      <h2 className="mt-2 font-display text-2xl font-bold">Category trends</h2>
      <p className="mt-1 text-sm text-ink-secondary">This month compared with your previous three-month average.</p>

      {trends.length === 0 ? (
        <EmptyState title="Build your spending story" to="/home#transactions" actionLabel="Add a transaction">Add expenses to see how categories change over time.</EmptyState>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {trends.map((trend) => {
            const style = trendStyles[trend.trend] || trendStyles.stable
            const percent = Number(trend.percentChange) || 0

            return (
              <li key={trend.category} className="rounded-2xl bg-surface-muted p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-semibold">{trend.category}</p>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl font-bold ${style.background} ${style.color}`} aria-hidden="true">
                    {style.symbol}
                  </span>
                </div>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <p className={`font-display text-2xl font-bold ${style.color}`}>
                    {percent > 0 ? '+' : ''}{percent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-ink-muted">{style.label}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default CategoryTrends
