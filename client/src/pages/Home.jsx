import { apiError } from '../utils/validation'
import { LoadingState, ErrorState } from '../components/Feedback'
import Transactions from '../components/Transactions'
import { useEffect, useRef, useState } from 'react'
import client from '../api/client'
import CashFlowChart from '../components/CashFlowChart'
import HealthScoreRing from '../components/HealthScoreRing'
import HeroCard from '../components/HeroCard'
import DaysLeftCard from '../components/DaysLeftCard'
import MonthlyWasteBanner from '../components/MonthlyWasteBanner'
import UpcomingDebits from '../components/UpcomingDebits'
import { useAuth } from '../context/authContext'
import { Link } from 'react-router-dom'

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
  const [transactionFormOpen, setTransactionFormOpen] = useState(false)
  const hasLoaded = useRef(false)

  const openTransactionForm = () => {
    setTransactionFormOpen(true)
    requestAnimationFrame(() => document.getElementById('transactions')?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
  }

  useEffect(() => {
    let ignore = false

    const loadDashboard = async () => {
      try {
        if (!hasLoaded.current) setLoading(true)
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
        hasLoaded.current = true
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
            <p className="page-eyebrow">Your workspace</p>
            <h1 className="page-title">Overview</h1>
            <p className="page-description">{user?.name ? `Welcome back, ${user.name}. ` : ''}Here is where your money stands today.</p>
          </div>
          <button type="button" className="action-button" onClick={openTransactionForm}>+ Add transaction</button>
        </header>

        {loading ? (
          <LoadingState label="Loading dashboard" />
        ) : error ? (
          <ErrorState message={error} onRetry={() => setRefreshKey((current) => current + 1)} />
        ) : (
          <div>
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
          </div>
        )}
        <div className="section-heading"><div><h2>Activity</h2><p>Keep your records up to date.</p></div></div>
        <Transactions onChanged={() => setRefreshKey((current) => current + 1)} formOpen={transactionFormOpen} onFormOpenChange={setTransactionFormOpen} />
        {!loading && !error && <><div className="section-heading"><div><h2>Looking ahead</h2><p>Upcoming charges and your cash flow over time.</p></div></div><div className="dashboard-lower-grid"><UpcomingDebits subscriptions={subscriptions} />{summary.cashFlow.length > 0 && <CashFlowChart cashFlow={summary.cashFlow} />}</div></>}
      </div>
    </main>
  )
}

export default Home
