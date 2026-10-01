import { lazy, Suspense } from 'react'
import { LoadingState } from './components/Feedback'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { useAuth } from './context/authContext'
const Home = lazy(() => import('./pages/Home'))
const Insights = lazy(() => import('./pages/Insights'))
const Login = lazy(() => import('./pages/Login'))
const Profile = lazy(() => import('./pages/Profile'))
const Signup = lazy(() => import('./pages/Signup'))
const Subscriptions = lazy(() => import('./pages/Subscriptions'))

function LandingRedirect() {
  const { token } = useAuth()
  return <Navigate to={token ? '/home' : '/login'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<main className="min-h-screen bg-surface p-6"><LoadingState label="Loading page" /></main>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<AppShell />}>
          <Route path="/home" element={<Home />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<LandingRedirect />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
