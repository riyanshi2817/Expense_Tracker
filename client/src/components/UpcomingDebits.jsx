import { useState } from 'react'
import { Link } from 'react-router-dom'
import DebitConfirmation from './DebitConfirmation'

const money = (value) => Number(value).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
export default function UpcomingDebits({ subscriptions = [] }) {
  const [selected, setSelected] = useState(null)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const end = new Date(now.getTime() + 7 * 86400000)
  const upcoming = subscriptions.filter((item) => new Date(item.nextDueDate) >= now && new Date(item.nextDueDate) <= end).sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))
  return <section className="rounded-card border border-border bg-surface-elevated p-6 shadow-card">
    <div className="flex items-end justify-between gap-4"><div><h2 className="font-display text-xl font-bold">Upcoming debits</h2><p className="mt-1 text-sm text-ink-secondary">Subscriptions due in the next 7 days</p></div><span className="rounded-full bg-surface-muted px-3 py-1 text-xs">{upcoming.length}</span></div>
    {!upcoming.length ? <div className="mt-6 rounded-2xl border border-dashed border-border p-4 text-center"><p className="text-sm text-ink-secondary">No subscription debits due soon.</p><Link className="action-button mt-4 inline-flex" to="/subscriptions#subscription-form">{subscriptions.length ? 'Manage subscriptions' : 'Add your first subscription'}</Link></div> :
      <ul className="mt-5 space-y-3">{upcoming.map((debit) => <li key={debit._id}><button type="button" aria-haspopup="dialog" onClick={() => setSelected(debit)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-surface-muted p-4 text-left transition hover:bg-accent/15">
        <span className="min-w-0"><span className="block break-words font-semibold">{debit.name}</span><span className="mt-1 block text-xs text-ink-muted">Due {new Date(debit.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} / {debit.billingCycle}</span></span><span className="shrink-0 font-semibold">{money(debit.amount)}</span>
      </button></li>)}</ul>}
    <DebitConfirmation debit={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
  </section>
}
