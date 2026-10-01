import { apiError } from '../utils/validation'
import { LoadingState, ErrorState, EmptyState } from '../components/Feedback'
import Transactions from '../components/Transactions'
import { useEffect, useState } from 'react'
import client from '../api/client'
import CashFlowChart from '../components/CashFlowChart'
import HealthScoreRing from '../components/HealthScoreRing'
import HeroCard from '../components/HeroCard'
import DaysLeftCard from '../components/DaysLeftCard'
import MonthlyWasteBanner from '../components/MonthlyWasteBanner'
import UpcomingDebits from '../components/UpcomingDebits'
import { useAuth } from '../context/authContext'

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
  const { user, logout } = useAuth()
  const [summary, setSummary] = useState(emptySummary)
  const [analytics, setAnalytics] = useState(emptyAnalytics)
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let ignore = false

    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const [summaryResponse, analyticsResponse, subscriptionsResponse] =
          await Promise.all([
            client.get('/api/dashboard/summary'),
            client.get('/api/dashboard/analytics'),
            client.get('/api/subscriptions'),
          ])

        if (ignore) return

        setSummary({ ...emptySummary, ...summaryResponse.data })
        setAnalytics({ ...emptyAnalytics, ...analyticsResponse.data })
        setSubscriptions(subscriptionsResponse.data.subscriptions || [])
      } catch (requestError) {
        if (ignore) return

        setError(
          apiError(requestError, 'We could not load your dashboard. Make sure the API is running and try again.'),
        )
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadDashboard()
    return () => {
      ignore = true
    }
  }, [logout, refreshKey])

  return (
    <main className="app-page">
      <div className="page-container">
        <header className="page-header">
          <div>
            <p className="page-eyebrow">Your overview</p>
            <h1 className="page-title">
              {user?.name ? `Good to see you, ${user.name}` : 'Your money, clearly'}
            </h1>
            <p className="page-description">A clear view of what is available, what is coming up, and where your money went.</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="quiet-button"
          >
            Log out
          </button>
        </header>

        {loading ? (
          <LoadingState label="Loading dashboard" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setRefreshKey((current) => current + 1)} />
        ) : (
          <div className="space-y-6">
            {!summary.cashFlow.length && <EmptyState title="Welcome to your fresh start" to="/home#transactions" actionLabel="Add your first transaction">Add some income or an expense, then set your monthly budget in Profile.</EmptyState>}
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.75fr)]">
              <HeroCard
                salary={summary.salary}
                fixedCommitments={summary.fixedCommitments}
                safeToSpendPerDay={summary.safeToSpendPerDay}
                remainingThisMonth={summary.remainingThisMonth}
              />
              <HealthScoreRing score={analytics.healthScore?.score} hasHistory={analytics.transactionCount > 0} />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              <MonthlyWasteBanner monthlyWaste={summary.monthlyWaste} />
              <DaysLeftCard daysLeft={summary.daysLeftInMonth} />
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
              <CashFlowChart cashFlow={summary.cashFlow} />
              <UpcomingDebits subscriptions={subscriptions} />
            </div>
          </div>
        )}
        <Transactions onChanged={() => setRefreshKey((current) => current + 1)} />
      </div>
    </main>
  )
}

export default Home
