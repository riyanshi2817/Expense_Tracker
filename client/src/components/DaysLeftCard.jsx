export default function DaysLeftCard({ daysLeft = 0 }) {
  const days = Math.max(0, Number(daysLeft) || 0)
  return <section className="rounded-card border border-accent/25 bg-accent/10 p-4 sm:p-6">
    <h2 className="text-sm font-semibold text-ink">Days Left</h2>
    <p className="mt-3 text-2xl font-bold text-accent-soft">{days} <span className="text-sm">{days === 1 ? 'day' : 'days'}</span></p>
    <p className="mt-2 text-xs leading-5 text-ink-secondary">Until month end, including today.</p>
  </section>
}
