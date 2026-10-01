const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

function WasteBanner({ totalMonthlyCost = 0, unusedCount = 0 }) {
  return (
    <aside className="app-card subscription-savings">
      <p className="page-eyebrow">Possible savings</p>
      <strong>{formatCurrency(totalMonthlyCost)}<small> / month</small></strong>
      <span>{unusedCount ? `${unusedCount} ${unusedCount === 1 ? 'subscription marked' : 'subscriptions marked'} unused` : 'No subscriptions marked unused'}</span>
    </aside>
  )
}

export default WasteBanner
