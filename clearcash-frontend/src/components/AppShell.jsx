import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppNavigation from './AppNavigation'
import ProtectedRoute from './ProtectedRoute'

function AppShell() {
  const location = useLocation()
  useEffect(() => {
    if (!location.hash) return
    const frame = requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, location.hash, location.key])
  return (
    <ProtectedRoute>
      <Outlet />
      <AppNavigation />
    </ProtectedRoute>
  )
}

export default AppShell
