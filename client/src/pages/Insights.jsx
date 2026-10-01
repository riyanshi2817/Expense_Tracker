import { apiError } from '../utils/validation'
import { lazy, Suspense, useState } from 'react'
import WeeklyDigest from '../components/WeeklyDigest'
import { ChartSkeleton, InsightsSkeleton, EmptyState, FetchingSurface } from '../components/Feedback'
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { queryFns, queryKeys } from '../api/queries'
import AnomalyFeed from '../components/AnomalyFeed'
import CategoryTrends from '../components/CategoryTrends'
import GoalsList from '../components/GoalsList'
import HealthScoreBreakdown from '../components/HealthScoreBreakdown'

const CashFlowChart = lazy(() => import('../components/CashFlowChart'))
const SpendingMix = lazy(() => import('../components/SpendingMix'))

const emptyAnalytics = {
  anomalies: [],
  spendingMix: [],
  categoryTrends: [],
  healthScore: { score: 0, breakdown: {} },
}

function Insights() {
  const queryClient = useQueryClient()
  const [analyticsQuery, goalsQuery, summaryQuery] = useQueries({ queries: [
    { queryKey: queryKeys.analytics, queryFn: queryFns.analytics },
    { queryKey: queryKeys.goals, queryFn: queryFns.goals },
    { queryKey: queryKeys.summary, queryFn: queryFns.summary },
  ] })
  const analytics = { ...emptyAnalytics, ...analyticsQuery.data }
  const goals = goalsQuery.data?.goals || []
  const cashFlow = summaryQuery.data?.cashFlow || []
  const insightQueries = [analyticsQuery, goalsQuery, summaryQuery]
  const loading = insightQueries.some((query) => query.isPending)
  const error = insightQueries.find((query) => query.isError && !query.data)?.error
  const refreshError = insightQueries.find((query) => query.isError && query.data)?.error
  const fetching = !loading && insightQueries.some((query) => query.isFetching)
  const [mutationError, setMutationError] = useState('')
  const createMutation = useMutation({ mutationFn: (goal) => client.post('/api/goals', goal), onSuccess: ({ data }) => queryClient.setQueryData(queryKeys.goals, (current) => ({ ...current, goals: [data.goal, ...(current?.goals || [])] })) })
  const updateMutation = useMutation({ mutationFn: ({ id, updates }) => client.put(`/api/goals/${id}`, updates), onSuccess: ({ data }) => queryClient.setQueryData(queryKeys.goals, (current) => ({ ...current, goals: (current?.goals || []).map((goal) => goal._id === data.goal._id ? data.goal : goal) })) })
  const deleteMutation = useMutation({ mutationFn: (id) => client.delete(`/api/goals/${id}`), onSuccess: (_response, id) => queryClient.setQueryData(queryKeys.goals, (current) => ({ ...current, goals: (current?.goals || []).filter((goal) => goal._id !== id) })) })

  const createGoal = async (goal) => {
    try {
      setMutationError('')
      await createMutation.mutateAsync(goal)
      return true
    } catch (requestError) {
      setMutationError(apiError(requestError, 'Unable to create goal.'))
      return false
    }
  }

  const updateGoal = async (id, updates) => {
    try {
      setMutationError('')
      await updateMutation.mutateAsync({ id, updates })
      return true
    } catch (requestError) {
      setMutationError(apiError(requestError, 'Unable to update goal.'))
      return false
    }
  }

  const deleteGoal = async (id) => {
    try {
      setMutationError('')
      await deleteMutation.mutateAsync(id)
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
          <p className="page-description">Understand patterns in your spending and see how your goals are progressing.</p></div>
        </header>

        {(error || refreshError || mutationError) && (
          <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <span>{error ? apiError(error, 'Unable to load insights.') : refreshError ? apiError(refreshError, 'Unable to refresh insights.') : mutationError}</span>
            {error || refreshError ? (
              <button type="button" onClick={() => insightQueries.forEach((query) => query.refetch())} className="font-bold">Try again</button>
            ) : (
              <button type="button" onClick={() => setMutationError('')} className="font-bold">Dismiss</button>
            )}
          </div>
        )}

        {loading ? (
          <InsightsSkeleton />
        ) : !error ? (
          <FetchingSurface active={fetching} label="Refreshing insights">
            <Suspense fallback={<ChartSkeleton />}><CashFlowChart cashFlow={cashFlow} /></Suspense>
            <div className="section-heading"><div><h2>Spending patterns</h2><p>Where your money is going and what has changed.</p></div></div>
            <div className="insights-grid"><Suspense fallback={<ChartSkeleton />}><SpendingMix spendingMix={analytics.spendingMix} /></Suspense><CategoryTrends trends={analytics.categoryTrends} /></div>
            <div className="section-heading"><div><h2>What to watch</h2><p>Signals that may need a closer look.</p></div></div>
            <div className="insights-grid">
              {analytics.notificationPrefs?.unusualSpendingAlerts === false ? <section className="app-card"><EmptyState title="Unusual spending alerts are off" to="/profile" actionLabel="Notification preferences" /></section> : <AnomalyFeed anomalies={analytics.anomalies} hasHistory={analytics.transactionCount > 0} />}
              <HealthScoreBreakdown healthScore={analytics.healthScore} hasHistory={analytics.transactionCount > 0} />
            </div>
            <div className="section-heading"><div><h2>Your goals</h2><p>Track progress and review the week.</p></div></div>
            <div className="insights-grid"><GoalsList goals={goals} onCreate={createGoal} onUpdate={updateGoal} onDelete={deleteGoal} />{analytics.notificationPrefs?.weeklySummary !== false && <WeeklyDigest digest={analytics.weeklyDigest} />}</div>
          </FetchingSurface>
        ) : null}
      </div>
    </main>
  )
}

export default Insights
