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
import { useLocation } from 'react-router-dom'

function Subscriptions() {
  const { logout } = useAuth()
  const location = useLocation()
  const [filter, setFilter] = useState('all')
  const [subscriptions, setSubscriptions] = useState([])
  const [waste, setWaste] = useState({ totalMonthlyRecurring: 0, monthlyWaste: 0, potentialSavings: 0, unusedSubscriptionCount: 0 })
  const [pendingIds, setPendingIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(() => location.hash === '#subscription-form')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (location.hash !== '#subscription-form') return undefined
    const frame = requestAnimationFrame(() => setFormOpen(true))
    return () => cancelAnimationFrame(frame)
  }, [location.hash])

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
    setFormOpen(false)
    setRefreshKey((current) => current + 1)
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
      <div className="page-container max-w-6xl">
        <header className="page-header">
          <div>
            <p className="page-eyebrow">Recurring spend</p>
            <h1 className="page-title">Subscriptions</h1>
            <p className="page-description">Spot services you pay for but no longer use.</p>
          </div>
          <button type="button" className="action-button" onClick={openNew}>+ Add subscription</button>
        </header>
        <ErrorState message={mutationError} />

        {loading ? (
          <LoadingState label="Loading subscriptions" />
        ) : error ? <ErrorState message={error} onRetry={() => setRefreshKey((current) => current + 1)} /> : (
          <div>
            <div className="subscription-summary-grid">
              <section className="app-card subscription-total"><p className="page-eyebrow">Monthly recurring</p><strong>{Number(waste.totalMonthlyRecurring || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</strong><span>Across all subscriptions · yearly charges averaged monthly</span></section>
              <WasteBanner totalMonthlyCost={waste.monthlyWaste} unusedCount={waste.unusedSubscriptionCount} />
            </div>

            {formOpen && <section id="subscription-form" className="app-card composer-panel subscription-composer"><EntryForm key={editing?._id || 'new'} kind="subscription" initial={editing} onSave={saveSubscription} onCancel={() => { setEditing(null); setFormOpen(false) }} /></section>}

            <div className="section-heading subscription-list-heading"><div><h2>Your subscriptions</h2><p>Review what renews and what you still use.</p></div><FilterTabs value={filter} onChange={setFilter} /></div>
            <SubscriptionList onEdit={openEdit} filter={filter} onResetFilter={() => setFilter('all')} subscriptions={subscriptions} pendingIds={pendingIds} onToggle={toggleSubscription} onDelete={deleteSubscription} onAdd={openNew} />
          </div>
        )}
      </div>
    </main>
  )
}

export default Subscriptions
