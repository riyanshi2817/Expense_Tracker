const formatCurrency = (value, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits }).format(Number(value) || 0)

function HeroCard({ salary = 0, fixedCommitments = 0, safeToSpendPerDay, remainingThisMonth }) {
  const breakdown = [['Monthly income', salary], ['Fixed costs', fixedCommitments], ['After fixed costs', Number(salary) - Number(fixedCommitments)]]
  return (
    <section className="hero-card">
      <div>
        <p className="hero-eyebrow">Available today</p>
        <p className="hero-amount">{formatCurrency(safeToSpendPerDay, 2)}</p>
        <p className="hero-secondary mt-4 text-sm">Safe to spend today · {formatCurrency(remainingThisMonth, 2)} remaining this month</p>
      </div>
      <div>
        <dl className="mt-8 grid grid-cols-3 gap-3 border-t border-white/20 pt-5">
          {breakdown.map(([label, amount]) => <div key={label} className="min-w-0">
            <dt className="hero-secondary text-[11px] font-medium">{label}</dt>
            <dd className="mt-1 break-words text-sm font-bold text-white sm:text-lg">{formatCurrency(amount)}</dd>
          </div>)}
        </dl>
        <p className="hero-secondary mt-4 text-xs">After fixed costs is income less commitments, before recorded expenses.</p>
      </div>
    </section>
  )
}
export default HeroCard
