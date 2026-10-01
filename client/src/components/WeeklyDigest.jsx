import { EmptyState } from './Feedback'
const money = (value) => Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
export default function WeeklyDigest({ digest }) {
  return <section className="rounded-card border border-border bg-surface-elevated p-6 shadow-card lg:col-span-2">
    <h2 className="font-display text-xl font-bold">Weekly Digest</h2>
    <p className="mt-1 text-sm text-ink-secondary">Your last seven calendar days, including today.</p>
    {!digest?.transactionCount ? <EmptyState title="No transactions this week" to="/home#transactions" actionLabel="Add a transaction">Your weekly recap will appear as you log income and expenses.</EmptyState> : <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[['Income', digest.income], ['Spending', digest.expense], ['Net', digest.net]].map(([label, amount]) => <div key={label} className="rounded-xl bg-surface-muted p-4"><dt className="text-sm text-ink-secondary">{label}</dt><dd className="mt-1 text-xl font-bold">{money(amount)}</dd></div>)}
    </dl>}
  </section>
}
