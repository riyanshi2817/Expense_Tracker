import { apiError } from '../utils/validation'
import { LoadingState } from '../components/Feedback'
import { useEffect, useState } from 'react'
import client from '../api/client'
import EntryForm from '../components/EntryForm'
import { ErrorState } from '../components/Feedback'
import FilterTabs from '../components/FilterTabs'
import SubscriptionList from '../components/SubscriptionList'
import WasteBanner from '../components/WasteBanner'
import { useAuth } from '../context/authContext'

function Subscriptions() {
  const { logout } = useAuth()
  const [filter, setFilter] = useState('all')
  const [subscriptions, setSubscriptions] = useState([])
  const [waste, setWaste] = useState({ totalMonthlyRecurring: 0, monthlyWaste: 0, potentialSavings: 0, unusedSubscriptionCount: 0 })
  const [pendingIds, setPendingIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [editing, setEditing] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let ignore = false

    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const params = filter === 'all' ? {} : { status: filter }
        const [listResponse, wasteResponse] = await Promise.all([
          client.get('/api/subscriptions', { params }),
          client.get('/api/subscriptions/waste'),
        ])

        if (ignore) return
        setSubscriptions(listResponse.data.subscriptions || [])
        setWaste(wasteResponse.data)
      } catch (requestError) {
        if (ignore) return
        if (requestError.response?.status === 401) {
          logout()
          return
        }
        setError(apiError(requestError, 'Unable to load subscriptions.'))
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [filter, logout, refreshKey])

  const toggleSubscription = async (subscription) => {
    if (pendingIds.length) return
    setMutationError('')
    const previousSubscriptions = subscriptions
    const nextStatus = subscription.status === 'active' ? 'unused' : 'active'
    setPendingIds((current) => [...current, subscription._id])
    setSubscriptions((current) =>
      current.map((item) =>
        item._id === subscription._id ? { ...item, status: nextStatus } : item,
      ),
    )

    try {
      await client.put(`/api/subscriptions/${subscription._id}`, { status: nextStatus })
      setRefreshKey((current) => current + 1)
    } catch (requestError) {
      setSubscriptions(previousSubscriptions)
      setMutationError(apiError(requestError, 'Unable to update subscription.'))
    } finally {
      setPendingIds((current) => current.filter((id) => id !== subscription._id))
    }
  }

  const deleteSubscription = async (subscription) => {
    if (pendingIds.length) return
    setMutationError('')
    setPendingIds((current) => [...current, subscription._id])
    try {
      await client.delete(`/api/subscriptions/${subscription._id}`)
      setSubscriptions((current) => current.filter((item) => item._id !== subscription._id))
      setRefreshKey((current) => current + 1)
    } catch (requestError) {
      setMutationError(apiError(requestError, 'Unable to delete subscription.'))
    } finally {
      setPendingIds((current) => current.filter((id) => id !== subscription._id))
    }
  }

  const saveSubscription = async (values) => {
    if (editing) await client.put('/api/subscriptions/' + editing._id, values)
    else await client.post('/api/subscriptions', values)
    setEditing(null)
    setRefreshKey((current) => current + 1)
  }

  return (
    <main className="min-h-screen bg-surface pb-24 text-ink lg:pb-0 lg:pl-24">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent-soft">Recurring spend</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Subscriptions</h1>
            <p className="mt-2 text-sm text-ink-secondary">Spot services you pay for but no longer use.</p>
          </div>
          <FilterTabs value={filter} onChange={setFilter} />
        </header>

        <section id="subscription-form" className="mb-6 rounded-card border border-border bg-surface-elevated p-5 sm:p-7">
          <EntryForm key={editing?._id || 'new'} kind="subscription" initial={editing} onSave={saveSubscription} onCancel={editing ? () => setEditing(null) : undefined} />
        </section>
        <ErrorState message={mutationError} />

        {loading ? (
          <LoadingState label="Loading subscriptions" />
        ) : error ? <ErrorState message={error} onRetry={() => setRefreshKey((current) => current + 1)} /> : (
          <div className="space-y-6">
            <WasteBanner totalMonthlyCost={waste.monthlyWaste} unusedCount={waste.unusedSubscriptionCount} />
            <SubscriptionList onEdit={(item) => { setEditing(item); document.getElementById('subscription-form')?.scrollIntoView({ block: 'start' }) }} filter={filter} onResetFilter={() => setFilter('all')} subscriptions={subscriptions} pendingIds={pendingIds} onToggle={toggleSubscription} onDelete={deleteSubscription} />
            <section aria-label="Monthly subscription summary" className="rounded-card border border-border bg-surface-elevated p-5 sm:p-6">
              <dl className="grid gap-5 sm:grid-cols-2">
                {[['Total Monthly Recurring', waste.totalMonthlyRecurring], ['Potential Savings', waste.potentialSavings]].map(([label, amount]) => <div key={label}>
                  <dt className="text-sm font-semibold text-ink-secondary">{label}</dt>
                  <dd className="mt-2 break-words text-2xl font-bold text-accent-soft">{Number(amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}<span className="text-sm font-normal"> / month</span></dd>
                </div>)}
              </dl>
              <p className="mt-4 text-xs leading-5 text-ink-muted">Totals cover all subscriptions, regardless of the selected filter. Yearly charges are divided by 12; potential savings are the monthly costs of unused services.</p>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}

export default Subscriptions
