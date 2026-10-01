import { apiError } from '../utils/validation'
import { LoadingState } from '../components/Feedback'
import { useEffect, useState } from 'react'
import client from '../api/client'
import AccountDetailsForm from '../components/AccountDetailsForm'
import LogoutButton from '../components/LogoutButton'
import NotificationPrefs from '../components/NotificationPrefs'
import { useAuth } from '../context/authContext'

const defaultPreferences = {
  dueDateAlerts: true,
  unusualSpendingAlerts: true,
  weeklySummary: true,
}

function Profile() {
  const { logout, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      try {
        setLoading(true)
        setError('')
        const { data } = await client.get('/api/users/me')
        if (active) { setProfile(data.user); updateUser(data.user) }
      } catch (requestError) {
        if (!active) return
        if (requestError.response?.status === 401) {
          logout()
          return
        }
        setError(apiError(requestError, 'Unable to load your profile.'))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [logout, refreshKey, updateUser])

  useEffect(() => {
    if (!toast) return undefined
    const timeoutId = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const updateProfile = (updatedUser) => {
    setProfile(updatedUser)
    updateUser(updatedUser)
  }

  return (
    <main className="app-page">
      {toast && (
        <div role="status" className="fixed right-5 top-5 z-[80] flex items-center gap-2 rounded-xl border border-success/30 bg-surface-elevated px-4 py-3 text-sm font-semibold text-success shadow-card">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-xs text-surface">✓</span>
          {toast}
        </div>
      )}

      <div className="page-container max-w-6xl">
        <header className="page-header">
          <div><p className="page-eyebrow">Account settings</p>
          <h1 className="page-title">Your profile</h1>
          <p className="page-description">Keep your plan and reminders in step with your life.</p></div>
        </header>

        {loading ? (
          <LoadingState label="Loading profile" />
        ) : error ? (
          <section role="alert" className="rounded-card border border-danger/30 bg-danger/10 px-6 py-10 text-center">
            <h2 className="font-display text-xl font-bold">Profile unavailable</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ink-secondary">{error}</p>
            <button type="button" onClick={() => setRefreshKey((current) => current + 1)} className="action-button mt-6">Try again</button>
          </section>
        ) : profile ? (
          <div>
          <section className="app-card mb-5 flex flex-wrap items-center gap-4">
            <div aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent font-display text-xl font-extrabold text-onprimary">{profile.name?.trim()?.[0]?.toUpperCase() || 'C'}</div>
            <div className="min-w-0"><p className="font-display text-lg font-extrabold text-ink">{profile.name}</p><p className="break-all text-sm text-ink-secondary">{profile.email}</p></div>
          </section>
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
            <AccountDetailsForm profile={profile} onUpdated={updateProfile} onSuccess={setToast} />

            <div className="space-y-6">
              <NotificationPrefs
                preferences={{ ...defaultPreferences, ...profile.notificationPrefs }}
                onUpdated={updateProfile}
                onSuccess={setToast}
              />

              <section className="feature-card">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-elevated text-accent-soft">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M4 7h16M7 3v4m10-4v4M5 11h14v9H5z" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold">Manual entry mode</h2>
                    <p className="mt-1 text-sm leading-6 text-ink-secondary">Add transactions and subscriptions yourself. Bank sync is coming soon.</p>
                  </div>
                </div>
              </section>

              <section className="rounded-card border border-border bg-surface-elevated p-6 shadow-card">
                <h2 className="font-display text-lg font-bold">Session</h2>
                <p className="mb-5 mt-1 text-sm text-ink-secondary">Signing out clears your saved session from this device.</p>
                <LogoutButton />
              </section>
            </div>
          </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}

export default Profile
