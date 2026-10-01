import { apiError } from '../utils/validation'
import { useEffect, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { invalidateFinancialData, queryFns, queryKeys } from '../api/queries'
import EntryForm from '../components/EntryForm'
import { ErrorState, FetchingSurface, SubscriptionsSkeleton } from '../components/Feedback'
import FilterTabs from '../components/FilterTabs'
import SubscriptionList from '../components/SubscriptionList'
import WasteBanner from '../components/WasteBanner'
import { useLocation } from 'react-router-dom'

function Subscriptions() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const [filter, setFilter] = useState('all')
  const listQuery = useQuery({ queryKey: queryKeys.subscriptionList(filter), queryFn: queryFns.subscriptions(filter), placeholderData: keepPreviousData })
  const wasteQuery = useQuery({ queryKey: queryKeys.subscriptionWaste, queryFn: queryFns.subscriptionWaste })
  const subscriptions = listQuery.data?.subscriptions || []
  const waste = wasteQuery.data || { totalMonthlyRecurring: 0, monthlyWaste: 0, potentialSavings: 0, unusedSubscriptionCount: 0 }
  const loading = listQuery.isPending || wasteQuery.isPending
  const error = [listQuery, wasteQuery].find((query) => query.isError && !query.data)?.error
  const refreshError = [listQuery, wasteQuery].find((query) => query.isError && query.data)?.error
  const [mutationError, setMutationError] = useState('')
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(() => location.hash === '#subscription-form')
  const invalidateSubscriptions = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions }),
    invalidateFinancialData(queryClient),
  ])
  const toggleMutation = useMutation({ mutationFn: ({ id, status }) => client.put(`/api/subscriptions/${id}`, { status }), onSuccess: invalidateSubscriptions })
  const deleteMutation = useMutation({ mutationFn: (id) => client.delete(`/api/subscriptions/${id}`), onSuccess: invalidateSubscriptions })
  const saveMutation = useMutation({ mutationFn: ({ id, values }) => id ? client.put(`/api/subscriptions/${id}`, values) : client.post('/api/subscriptions', values), onSuccess: invalidateSubscriptions })
  const pendingIds = [toggleMutation, deleteMutation].filter((mutation) => mutation.isPending).map((mutation) => mutation.variables?.id || mutation.variables)
  const fetching = !loading && !saveMutation.isPending && !toggleMutation.isPending && !deleteMutation.isPending && (listQuery.isFetching || wasteQuery.isFetching)

  useEffect(() => {
    if (location.hash !== '#subscription-form') return undefined
    const frame = requestAnimationFrame(() => setFormOpen(true))
    return () => cancelAnimationFrame(frame)
  }, [location.hash])

  const toggleSubscription = async (subscription) => {
    if (pendingIds.length) return
    setMutationError('')
    const nextStatus = subscription.status === 'active' ? 'unused' : 'active'
    try {
      await toggleMutation.mutateAsync({ id: subscription._id, status: nextStatus })
    } catch (requestError) {
      setMutationError(apiError(requestError, 'Unable to update subscription.'))
    }
  }

  const deleteSubscription = async (subscription) => {
    if (pendingIds.length) return
    setMutationError('')
    try {
      await deleteMutation.mutateAsync(subscription._id)
    } catch (requestError) {
      setMutationError(apiError(requestError, 'Unable to delete subscription.'))
    }
  }

  const saveSubscription = async (values) => {
    await saveMutation.mutateAsync({ id: editing?._id, values })
    setEditing(null)
    setFormOpen(false)
  }

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
    requestAnimationFrame(() => document.getElementById('subscription-form')?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
  }

  const openEdit = (item) => {
    setEditing(item)
    setFormOpen(true)
    requestAnimationFrame(() => document.getElementById('subscription-form')?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
  }

  return (
    <main className="app-page">
      <div className="page-container">
        <header className="page-header">
          <div>
            <p className="page-eyebrow">Recurring spend</p>
            <h1 className="page-title">Subscriptions</h1>
            <p className="page-description">Spot services you pay for but no longer use.</p>
          </div>
          <button type="button" className="action-button" onClick={openNew}>+ Add subscription</button>
        </header>
        <ErrorState message={mutationError || (refreshError && apiError(refreshError, 'Unable to refresh subscriptions.'))} onRetry={refreshError ? () => { listQuery.refetch(); wasteQuery.refetch() } : undefined} />

        {loading ? (
          <SubscriptionsSkeleton />
        ) : error ? <ErrorState message={apiError(error, 'Unable to load subscriptions.')} onRetry={() => { listQuery.refetch(); wasteQuery.refetch() }} /> : (
          <FetchingSurface active={fetching} label="Refreshing subscriptions">
            <div className="subscription-summary-grid">
              <section className="app-card subscription-total"><p className="page-eyebrow">Monthly recurring</p><strong>{Number(waste.totalMonthlyRecurring || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</strong><span>Across all subscriptions · yearly charges averaged monthly</span></section>
              <WasteBanner totalMonthlyCost={waste.monthlyWaste} unusedCount={waste.unusedSubscriptionCount} />
            </div>

            {formOpen && <section id="subscription-form" className="app-card composer-panel subscription-composer"><EntryForm key={editing?._id || 'new'} kind="subscription" initial={editing} onSave={saveSubscription} onCancel={() => { setEditing(null); setFormOpen(false) }} /></section>}

            <div className="section-heading subscription-list-heading"><div><h2>Your subscriptions</h2><p>Review what renews and what you still use.</p></div><FilterTabs value={filter} onChange={setFilter} /></div>
            <div aria-busy={listQuery.isFetching} className={listQuery.isPlaceholderData ? 'subscription-list-stale' : undefined}><SubscriptionList onEdit={openEdit} filter={filter} onResetFilter={() => setFilter('all')} subscriptions={subscriptions} pendingIds={pendingIds} togglingId={toggleMutation.isPending ? toggleMutation.variables?.id : null} deletingId={deleteMutation.isPending ? deleteMutation.variables : null} onToggle={toggleSubscription} onDelete={deleteSubscription} onAdd={openNew} /></div>
          </FetchingSurface>
        )}
      </div>
    </main>
  )
}

export default Subscriptions
