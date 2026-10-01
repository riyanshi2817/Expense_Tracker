import { useState } from 'react'
import { EmptyState } from './Feedback'

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0)
const dateLabel = (value) => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))

export default function SubscriptionList({ subscriptions, pendingIds, deletingId, togglingId, onToggle, onDelete, onEdit, onAdd, filter, onResetFilter }) {
  const [confirmingId, setConfirmingId] = useState(null)

  if (!subscriptions.length) return <section className="app-card"><EmptyState title={filter === 'all' ? 'No subscriptions yet' : 'Nothing in this view'} actionLabel={filter === 'all' ? 'Add a subscription' : 'View all subscriptions'} onAction={filter === 'all' ? onAdd : onResetFilter}>Keep your recurring costs together so you can spot services you no longer use.</EmptyState></section>

  return <ul className="subscription-list">{subscriptions.map((subscription) => {
    const isPending = pendingIds.length > 0
    const rowPending = pendingIds.includes(subscription._id)
    const isConfirming = confirmingId === subscription._id
    return <li key={subscription._id} className="app-card subscription-row" aria-busy={rowPending}>
      <div className="subscription-row-main">
        <span className="subscription-monogram" aria-hidden="true">{subscription.name?.trim()?.[0]?.toUpperCase() || 'S'}</span>
        <div className="subscription-name"><div><h3>{subscription.name}</h3><span className={`status-pill ${subscription.status === 'unused' ? 'is-unused' : 'is-active'}`}>{subscription.status}</span></div><p>Next payment {dateLabel(subscription.nextDueDate)}</p></div>
        <p className="subscription-price">{money(subscription.amount)}<small> / {subscription.billingCycle === 'yearly' ? 'year' : 'month'}</small></p>
      </div>
      <div className="subscription-row-actions">
        <button type="button" disabled={isPending} onClick={() => onEdit(subscription)}>Edit details</button>
        <button type="button" disabled={isPending} onClick={() => onToggle(subscription)}>{togglingId === subscription._id ? 'Updating…' : subscription.status === 'active' ? 'Mark unused' : 'Mark active'}</button>
        {isConfirming ? <><button type="button" disabled={isPending} onClick={() => setConfirmingId(null)}>Cancel</button><button type="button" className="danger-link" disabled={isPending} onClick={() => { setConfirmingId(null); onDelete(subscription) }}>Confirm delete</button></> : <button type="button" className="danger-link" disabled={isPending} onClick={() => setConfirmingId(subscription._id)}>{deletingId === subscription._id ? 'Deleting…' : 'Delete'}</button>}
      </div>
    </li>
  })}</ul>
}
