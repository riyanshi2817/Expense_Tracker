const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

function WasteBanner({ totalMonthlyCost = 0, unusedCount = 0 }) {
  return (
    <aside className="rounded-card border border-border bg-surface-elevated p-6 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-danger">Subscription waste</p>
          <p className="mt-1 font-display text-xl font-bold text-ink sm:text-2xl">
            {unusedCount ? `You could save ${formatCurrency(totalMonthlyCost)} a month` : 'No unused subscriptions right now'}
          </p>
        </div>
        <span className="w-fit rounded-full border border-danger/20 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger">
          {unusedCount} {unusedCount === 1 ? 'subscription' : 'subscriptions'}
        </span>
      </div>
    </aside>
  )
}

export default WasteBanner
