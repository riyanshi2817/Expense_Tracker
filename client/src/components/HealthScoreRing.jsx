import { EmptyState } from './Feedback'

function HealthScoreRing({ score = 0, hasHistory = true }) {
  const normalizedScore = Math.min(Math.max(Number(score) || 0, 0), 100)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (normalizedScore / 100) * circumference
  const colorClass =
    normalizedScore < 40
      ? 'text-danger'
      : normalizedScore <= 70
        ? 'text-warning'
        : 'text-success'
  const label =
    normalizedScore < 40
      ? 'Needs attention'
      : normalizedScore <= 70
        ? 'Building momentum'
        : 'Looking healthy'

  if (!hasHistory) return <section className="rounded-card border border-border bg-surface-elevated p-6"><h2 className="font-display text-xl font-bold">Financial health</h2><EmptyState title="Your score starts with your story" to="/home#transactions" actionLabel="Add a transaction">Log income and expenses to build your financial health score.</EmptyState></section>

  return (
    <section className="flex h-full flex-col rounded-card border border-border bg-surface-elevated p-6 shadow-card">
      <div>
        <p className="text-sm font-semibold text-ink">Financial health</p>
        <p className="mt-1 text-sm text-ink-secondary">Your combined money wellness score</p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-5">
        <div className={`relative h-36 w-36 ${colorClass}`}>
          <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="10"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-ink">
            <span className="font-display text-4xl font-bold">{Math.round(normalizedScore)}</span>
            <span className="text-xs text-ink-muted">out of 100</span>
          </div>
        </div>
        <p className={`mt-4 text-sm font-semibold ${colorClass}`}>{label}</p>
      </div>
    </section>
  )
}

export default HealthScoreRing
