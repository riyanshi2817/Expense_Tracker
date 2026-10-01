import { apiError } from '../utils/validation'
import SpendingMix from '../components/SpendingMix'
import CashFlowChart from '../components/CashFlowChart'
import WeeklyDigest from '../components/WeeklyDigest'
import { LoadingState, EmptyState } from '../components/Feedback'
import { useEffect, useState } from 'react'
import client from '../api/client'
import AnomalyFeed from '../components/AnomalyFeed'
import CategoryTrends from '../components/CategoryTrends'
import GoalsList from '../components/GoalsList'
import HealthScoreBreakdown from '../components/HealthScoreBreakdown'
import { useAuth } from '../context/authContext'

const emptyAnalytics = {
  anomalies: [],
  spendingMix: [],
  categoryTrends: [],
  healthScore: { score: 0, breakdown: {} },
}

function Insights() {
  const { logout } = useAuth()
  const [analytics, setAnalytics] = useState(emptyAnalytics)
  const [goals, setGoals] = useState([])
  const [cashFlow, setCashFlow] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const [analyticsResponse, goalsResponse, summaryResponse] = await Promise.all([
          client.get('/api/dashboard/analytics'),
          client.get('/api/goals'),
          client.get('/api/dashboard/summary'),
        ])
        if (ignore) return
        setAnalytics({ ...emptyAnalytics, ...analyticsResponse.data })
        setGoals(goalsResponse.data.goals || [])
        setCashFlow(summaryResponse.data.cashFlow || [])
      } catch (requestError) {
        if (ignore) return
        if (requestError.response?.status === 401) {
          logout()
          return
        }
        setError(apiError(requestError, 'Unable to load insights.'))
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [logout, refreshKey])

  const createGoal = async (goal) => {
    try {
      setMutationError('')
      const { data } = await client.post('/api/goals', goal)
      setGoals((current) => [data.goal, ...current])
      return true
    } catch (requestError) {
      setMutationError(apiError(requestError, 'Unable to create goal.'))
      return false
    }
  }

  const updateGoal = async (id, updates) => {
    try {
      setMutationError('')
      const { data } = await client.put(`/api/goals/${id}`, updates)
      setGoals((current) => current.map((goal) => (goal._id === id ? data.goal : goal)))
      return true
    } catch (requestError) {
      setMutationError(apiError(requestError, 'Unable to update goal.'))
      return false
    }
  }

  const deleteGoal = async (id) => {
    try {
      setMutationError('')
      await client.delete(`/api/goals/${id}`)
      setGoals((current) => current.filter((goal) => goal._id !== id))
      return true
    } catch (requestError) {
      setMutationError(apiError(requestError, 'Unable to delete goal.'))
      return false
    }
  }

  return (
    <main className="app-page">
      <div className="page-container">
        <header className="page-header">
          <div><p className="page-eyebrow">The bigger picture</p>
          <h1 className="page-title">Insights</h1>
          <p className="page-description">See what changed, what looks unusual, and where your next financial win can come from.</p></div>
        </header>

        {(error || mutationError) && (
          <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <span>{error || mutationError}</span>
            {error ? (
              <button type="button" onClick={() => setRefreshKey((current) => current + 1)} className="font-bold">Try again</button>
            ) : (
              <button type="button" onClick={() => setMutationError('')} className="font-bold">Dismiss</button>
            )}
          </div>
        )}

        {loading ? (
          <LoadingState label="Loading insights" />
        ) : !error ? (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2"><CashFlowChart cashFlow={cashFlow} /></div>
            {analytics.notificationPrefs?.unusualSpendingAlerts === false ? <section className="rounded-card border border-border bg-surface-elevated p-6"><EmptyState title="Unusual spending alerts are off" to="/profile" actionLabel="Notification preferences" /></section> : <AnomalyFeed anomalies={analytics.anomalies} hasHistory={analytics.transactionCount > 0} />}
            <SpendingMix spendingMix={analytics.spendingMix} />
            <CategoryTrends trends={analytics.categoryTrends} />
            <HealthScoreBreakdown healthScore={analytics.healthScore} hasHistory={analytics.transactionCount > 0} />
            <GoalsList goals={goals} onCreate={createGoal} onUpdate={updateGoal} onDelete={deleteGoal} />
            {analytics.notificationPrefs?.weeklySummary !== false && <WeeklyDigest digest={analytics.weeklyDigest} />}
          </div>
        ) : null}
      </div>
    </main>
  )
}

export default Insights
