const formatCurrency = (value, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits }).format(Number(value) || 0)

function HeroCard({ salary = 0, fixedCommitments = 0, safeToSpendPerDay, remainingThisMonth }) {
  const breakdown = [['Salary', salary], ['Fixed Out', fixedCommitments], ['Left', Number(salary) - Number(fixedCommitments)]]
  return (
    <section className="relative overflow-hidden rounded-card border border-accent/25 bg-gradient-to-br from-accent/25 via-surface-elevated to-surface-elevated p-6 shadow-glow sm:p-8">
      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative">
        <p className="text-sm font-medium text-accent-soft">Safe to spend today</p>
        <p className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">{formatCurrency(safeToSpendPerDay, 2)}</p>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">Remaining this month: {formatCurrency(remainingThisMonth, 2)}</p>
        <dl className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          {breakdown.map(([label, amount]) => <div key={label} className="min-w-0 rounded-2xl border border-white/5 bg-surface/45 px-2 py-3 sm:p-4">
            <dt className="text-xs font-semibold text-ink-muted">{label}</dt>
            <dd className="mt-1 break-words text-sm font-bold text-ink sm:text-lg">{formatCurrency(amount)}</dd>
          </div>)}
        </dl>
        <p className="mt-2 text-xs text-ink-muted">Left is salary minus fixed commitments, before recorded expenses.</p>
      </div>
    </section>
  )
}
export default HeroCard
