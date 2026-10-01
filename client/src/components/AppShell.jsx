import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppNavigation from './AppNavigation'
import ProtectedRoute from './ProtectedRoute'
import { DashboardSkeleton, InsightsSkeleton, ProfileSkeleton, SubscriptionsSkeleton } from './Feedback'

const loadingViews = {
  '/home': ['Overview', DashboardSkeleton],
  '/subscriptions': ['Subscriptions', SubscriptionsSkeleton],
  '/insights': ['Insights', InsightsSkeleton],
  '/profile': ['Your profile', ProfileSkeleton],
}

function RouteFallback({ pathname }) {
  const [title, Skeleton] = loadingViews[pathname] || ['Your workspace', DashboardSkeleton]
  return <main className="app-page"><div className="page-container"><header className="page-header"><div><p className="page-eyebrow">Loading workspace</p><h1 className="page-title">{title}</h1></div></header><Skeleton /></div></main>
}

function AppShell() {
  const location = useLocation()
  useEffect(() => {
    if (!location.hash) return
    const frame = requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, location.hash, location.key])
  return (
    <ProtectedRoute>
      <Suspense fallback={<RouteFallback pathname={location.pathname} />}><Outlet /></Suspense>
      <AppNavigation />
    </ProtectedRoute>
  )
}

export default AppShell
