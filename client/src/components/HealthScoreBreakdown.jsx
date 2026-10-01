const components = [
  { key: 'savingsRate', maxPoints: 40, label: 'Savings rate', color: 'bg-success', guidance: 'Higher is healthier' },
  { key: 'subscriptionWastePercent', maxPoints: 30, label: 'Subscription waste', color: 'bg-danger', guidance: 'Lower is healthier' },
  { key: 'spendingVolatility', maxPoints: 30, label: 'Spending volatility', color: 'bg-warning', guidance: 'Lower is healthier' },
]

import { EmptyState } from './Feedback'

function HealthScoreBreakdown({ healthScore = {}, hasHistory = true }) {
  const breakdown = healthScore.breakdown || {}

  if (!hasHistory) return <section className="rounded-card border border-border bg-surface-elevated p-6"><h2 className="font-display text-xl font-bold">Financial health</h2><EmptyState title="Your score starts with your story" to="/home#transactions" actionLabel="Add a transaction">Log income and expenses to build your financial health score.</EmptyState></section>

  return (
    <section className="rounded-card border border-border bg-surface-elevated p-6 shadow-card lg:p-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Health score breakdown</h2>
          <p className="mt-1 text-sm text-ink-secondary">See which habits move your score.</p>
        </div>
        <div className="shrink-0 whitespace-nowrap text-right">
          <p className="font-display text-3xl font-bold text-accent-soft">{(Number(healthScore.score) || 0).toFixed(2)}</p>
          <p className="text-xs text-ink-muted">overall</p>
        </div>
      </div>

      <div className="mt-7 space-y-6">
        {components.map((component) => {
          const metric = breakdown[component.key] || {}
          const value = Number(metric.value) || 0
          const weightedScore = Number(metric.weightedScore) || 0
          const progress = Math.min(Math.max(weightedScore / component.maxPoints * 100, 0), 100)
          return (
            <div key={component.key}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{component.label}</p>
                  <p className="text-xs text-ink-muted">{component.guidance} - {value.toFixed(1)}%</p>
                </div>
                <p className="text-right text-sm font-bold">{weightedScore.toFixed(2)} / {component.maxPoints} points</p>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
                <div className={`h-full rounded-full ${component.color} transition-all duration-700`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default HealthScoreBreakdown
