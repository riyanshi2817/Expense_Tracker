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
            <section className="app-card profile-identity">
              <div aria-hidden="true" className="profile-avatar">{profile.name?.trim()?.[0]?.toUpperCase() || 'C'}</div>
              <div className="min-w-0"><p className="page-eyebrow">Personal account</p><h2>{profile.name}</h2><p>{profile.email}</p></div>
            </section>
            <div className="settings-grid">
              <div className="settings-column">
                <AccountDetailsForm profile={profile} onUpdated={updateProfile} onSuccess={setToast} />
                <section className="app-card settings-note"><h2 className="app-card-title">How your plan works</h2><p>ClearCash uses your income and fixed costs to estimate what is safe to spend. Keep these figures current as your monthly commitments change.</p></section>
              </div>
              <div className="settings-column">
              <NotificationPrefs
                preferences={{ ...defaultPreferences, ...profile.notificationPrefs }}
                onUpdated={updateProfile}
                onSuccess={setToast}
              />
              <section className="app-card session-panel">
                <h2 className="app-card-title">Your session</h2>
                <p>Sign out of ClearCash on this device.</p>
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
