import { EmptyState } from './Feedback'
import { useState } from 'react'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

function SubscriptionList({ subscriptions, pendingIds, onToggle, onDelete, onEdit, filter, onResetFilter }) {
  const [confirmingId, setConfirmingId] = useState(null)

  if (subscriptions.length === 0) {
    return (
      <EmptyState title={filter === 'all' ? 'No subscriptions yet' : 'No subscriptions match this filter'} actionLabel={filter === 'all' ? 'Add your first subscription' : 'View all subscriptions'} onAction={filter === 'all' ? () => document.querySelector('#subscription-form input')?.focus() : onResetFilter}>Track recurring costs and spot services you no longer use.</EmptyState>
    )
  }

  return (
    <ul className="space-y-3">
      {subscriptions.map((subscription) => {
        const isPending = pendingIds.length > 0
        const isConfirming = confirmingId === subscription._id

        return (
          <li key={subscription._id} className="rounded-card border border-border bg-surface-elevated p-5 shadow-card transition hover:border-accent/40">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <h2 className="truncate font-display text-lg font-bold">{subscription.name}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider ${subscription.status === 'unused' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                    {subscription.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-secondary">
                  <span><strong className="text-ink">{formatCurrency(subscription.amount)}</strong> / {subscription.billingCycle === 'yearly' ? 'year' : 'month'}</span>
                  <span>Next due {formatDate(subscription.nextDueDate)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button type="button" disabled={isPending} className="rounded-xl px-3 py-2 text-sm font-semibold text-accent-soft" onClick={() => onEdit(subscription)}>Edit</button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onToggle(subscription)}
                  className="rounded-xl border border-border px-3.5 py-2 text-sm font-semibold text-ink-secondary transition hover:border-accent hover:text-ink disabled:cursor-wait disabled:opacity-50"
                >
                  {subscription.status === 'active' ? 'Mark unused' : 'Mark active'}
                </button>

                {isConfirming ? (
                  <>
                    <button type="button" onClick={() => setConfirmingId(null)} className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-muted hover:text-ink">
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setConfirmingId(null)
                        onDelete(subscription)
                      }}
                      className="rounded-xl bg-danger px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Confirm delete
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setConfirmingId(subscription._id)} className="rounded-xl px-3.5 py-2 text-sm font-semibold text-danger transition hover:bg-danger/10">
                    Delete
                  </button>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default SubscriptionList
