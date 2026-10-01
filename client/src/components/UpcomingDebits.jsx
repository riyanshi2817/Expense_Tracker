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
  return <section className="app-card upcoming-panel">
    <div className="panel-heading"><div><h2 className="app-card-title">Upcoming payments</h2><p>Subscriptions due in the next 7 days</p></div><span className="upcoming-count">{upcoming.length}</span></div>
    {!upcoming.length ? <div className="upcoming-empty"><p>No subscription payments due soon.</p><Link className="text-link" to="/subscriptions#subscription-form">{subscriptions.length ? 'Manage subscriptions' : 'Add a subscription'} →</Link></div> :
      <ul className="upcoming-list">{upcoming.map((debit) => <li key={debit._id}><button type="button" aria-haspopup="dialog" onClick={() => setSelected(debit)} className="upcoming-item">
        <span className="min-w-0"><span className="block break-words font-semibold">{debit.name}</span><span className="mt-1 block text-xs text-ink-muted">Due {new Date(debit.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} / {debit.billingCycle}</span></span><span className="shrink-0 font-semibold">{money(debit.amount)}</span>
      </button></li>)}</ul>}
    <DebitConfirmation debit={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
  </section>
}
