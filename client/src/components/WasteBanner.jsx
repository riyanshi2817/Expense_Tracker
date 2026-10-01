const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

function WasteBanner({ totalMonthlyCost = 0, unusedCount = 0 }) {
  return (
    <aside className="relative overflow-hidden rounded-card border border-danger/25 bg-gradient-to-r from-danger/15 via-surface-elevated to-surface-elevated p-6 shadow-card">
      <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-danger/15 blur-3xl" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-danger">Subscription waste</p>
          <p className="mt-1 font-display text-xl font-bold text-ink sm:text-2xl">
            You&apos;re losing {formatCurrency(totalMonthlyCost)}/month on unused subscriptions
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
