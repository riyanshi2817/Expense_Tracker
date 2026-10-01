import { EmptyState } from './Feedback'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

function AnomalyFeed({ anomalies = [], hasHistory = true }) {
  const sortedAnomalies = [...anomalies].sort(
    (first, second) => new Date(second.date) - new Date(first.date),
  )

  return (
    <section className="relative overflow-hidden rounded-card border border-danger/25 bg-gradient-to-br from-danger/10 via-surface-elevated to-surface-elevated p-6 shadow-card lg:p-7">
      <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-danger/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-danger">Anomaly radar</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Unusual spending</h2>
          <p className="mt-1 text-sm text-ink-secondary">Expenses that break your normal category pattern.</p>
        </div>
        <span className="flex h-10 min-w-10 items-center justify-center rounded-full border border-danger/30 bg-danger/10 px-3 font-bold text-danger">
          {sortedAnomalies.length}
        </span>
      </div>

      {!hasHistory ? <EmptyState title="No spending history yet" to="/home#transactions" actionLabel="Add a transaction">As you log expenses, we can spot unusual spending.</EmptyState> : sortedAnomalies.length === 0 ? (
        <div className="relative mt-6 rounded-2xl border border-dashed border-border bg-surface/30 px-5 py-9 text-center">
          <p className="font-semibold text-success">No unusual expenses detected</p>
          <p className="mt-1 text-sm text-ink-secondary">Keep tracking expenses to establish a useful baseline for each category.</p>
        </div>
      ) : (
        <ul className="relative mt-6 space-y-3">
          {sortedAnomalies.map((transaction, index) => (
            <li key={transaction._id || `${transaction.date}-${index}`} className="rounded-2xl border border-danger/20 bg-danger/8 p-4 transition hover:border-danger/40">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/15 text-danger">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 8v5m0 4h.01M10.3 3.8 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-bold text-ink">{transaction.category}</p>
                    <p className="font-display text-lg font-bold text-danger">{formatCurrency(transaction.amount)}</p>
                  </div>
                  <p className="mt-1 text-sm font-medium text-danger/90">{transaction.anomalyReason}</p>
                  <p className="mt-2 text-xs text-ink-muted">{formatDate(transaction.date)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default AnomalyFeed
