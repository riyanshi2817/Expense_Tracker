import { apiError } from '../utils/validation'
import { ChartSkeleton, DashboardSkeleton, ErrorState, FetchingSurface } from '../components/Feedback'
import Transactions from '../components/Transactions'
import { lazy, Suspense, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { queryFns, queryKeys } from '../api/queries'
import HealthScoreRing from '../components/HealthScoreRing'
import HeroCard from '../components/HeroCard'
import DaysLeftCard from '../components/DaysLeftCard'
import MonthlyWasteBanner from '../components/MonthlyWasteBanner'
import UpcomingDebits from '../components/UpcomingDebits'
import { useAuth } from '../context/authContext'
import { Link } from 'react-router-dom'

const CashFlowChart = lazy(() => import('../components/CashFlowChart'))

const emptySummary = {
  spendable: 0,
  safeToSpendPerDay: 0,
  remainingThisMonth: 0,
  daysLeftInMonth: 0,
  monthlyWaste: 0,
  cashFlow: [],
}

const emptyAnalytics = {
  anomalies: [],
  categoryTrends: [],
  healthScore: { score: 0, breakdown: {} },
}

function Home() {
  const { user } = useAuth()
  const [summaryQuery, analyticsQuery, subscriptionsQuery] = useQueries({ queries: [
    { queryKey: queryKeys.summary, queryFn: queryFns.summary },
    { queryKey: queryKeys.analytics, queryFn: queryFns.analytics },
    { queryKey: queryKeys.subscriptionList('all'), queryFn: queryFns.subscriptions('all') },
  ] })
  const summary = { ...emptySummary, ...summaryQuery.data }
  const analytics = { ...emptyAnalytics, ...analyticsQuery.data }
  const subscriptions = subscriptionsQuery.data?.subscriptions || []
  const dashboardQueries = [summaryQuery, analyticsQuery, subscriptionsQuery]
  const loading = dashboardQueries.some((query) => query.isPending)
  const error = dashboardQueries.find((query) => query.isError && !query.data)?.error
  const refreshError = dashboardQueries.find((query) => query.isError && query.data)?.error
  const fetching = !loading && dashboardQueries.some((query) => query.isFetching)
  const [transactionFormOpen, setTransactionFormOpen] = useState(false)

  const openTransactionForm = () => {
    setTransactionFormOpen(true)
    requestAnimationFrame(() => document.getElementById('transactions')?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
  }

  return (
    <main className="app-page">
      <div className="page-container">
        <header className="page-header">
          <div>
            <p className="page-eyebrow">Your workspace</p>
            <h1 className="page-title">Overview</h1>
            <p className="page-description">{user?.name ? `Welcome back, ${user.name}. ` : ''}Here is where your money stands today.</p>
          </div>
          <button type="button" className="action-button" onClick={openTransactionForm}>+ Add transaction</button>
        </header>

        {refreshError && <ErrorState message={apiError(refreshError, 'Some overview data could not be refreshed.')} onRetry={() => dashboardQueries.forEach((query) => query.refetch())} />}
        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={apiError(error, 'We could not load your dashboard.')} onRetry={() => dashboardQueries.forEach((query) => query.refetch())} />
        ) : (
          <FetchingSurface active={fetching} label="Refreshing your overview">
            <div className="overview-lead-grid">
              <HeroCard
                salary={summary.salary}
                fixedCommitments={summary.fixedCommitments}
                safeToSpendPerDay={summary.safeToSpendPerDay}
                remainingThisMonth={summary.remainingThisMonth}
              />
              <div className="overview-side-stack">
                {analytics.transactionCount > 0 ? <HealthScoreRing score={analytics.healthScore?.score} /> : <section className="app-card start-card"><p className="page-eyebrow">Getting started</p><h2 className="app-card-title">Build your first overview</h2><p>Set your monthly plan, then add income and expenses to see your financial health.</p><Link className="text-link" to="/profile">Set up your plan →</Link></section>}
                <div className="overview-metrics"><DaysLeftCard daysLeft={summary.daysLeftInMonth} /><MonthlyWasteBanner monthlyWaste={summary.monthlyWaste} /></div>
              </div>
            </div>
          </FetchingSurface>
        )}
        <div className="section-heading"><div><h2>Activity</h2><p>Keep your records up to date.</p></div></div>
        <Transactions formOpen={transactionFormOpen} onFormOpenChange={setTransactionFormOpen} />
        {!loading && !error && <><div className="section-heading"><div><h2>Looking ahead</h2><p>Upcoming charges and your cash flow over time.</p></div></div><div className="dashboard-lower-grid"><UpcomingDebits subscriptions={subscriptions} />{summary.cashFlow.length > 0 && <Suspense fallback={<ChartSkeleton />}><CashFlowChart cashFlow={summary.cashFlow} /></Suspense>}</div></>}
      </div>
    </main>
  )
}

export default Home
