export default function MonthlyWasteBanner({ monthlyWaste = 0 }) {
  const amount = Number(monthlyWaste) || 0
  return <section className="rounded-card border border-border bg-surface-elevated p-4 sm:p-6">
    <h2 className="text-sm font-semibold text-ink">Monthly Waste</h2>
    <p className="mt-3 break-words text-2xl font-bold text-warning">{amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</p>
    <p className="mt-2 text-xs leading-5 text-ink-secondary">{amount > 0 ? 'Potential savings from unused subscriptions.' : 'No unused subscription costs this month.'}</p>
  </section>
}
