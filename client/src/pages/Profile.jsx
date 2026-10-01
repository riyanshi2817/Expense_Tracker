import { apiError } from '../utils/validation'
import { FetchingSurface, ProfileSkeleton } from '../components/Feedback'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryFns, queryKeys } from '../api/queries'
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
  const { updateUser } = useAuth()
  const queryClient = useQueryClient()
  const profileQuery = useQuery({ queryKey: queryKeys.profile, queryFn: queryFns.profile })
  const profile = profileQuery.data?.user
  const error = profileQuery.isError && !profileQuery.data ? profileQuery.error : null
  const [toast, setToast] = useState('')
  useEffect(() => { if (profile) updateUser(profile) }, [profile, updateUser])

  useEffect(() => {
    if (!toast) return undefined
    const timeoutId = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const updateProfile = (updatedUser) => {
    queryClient.setQueryData(queryKeys.profile, { user: updatedUser })
    updateUser(updatedUser)
    queryClient.invalidateQueries({ queryKey: queryKeys.summary })
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics })
    queryClient.invalidateQueries({ queryKey: queryKeys.dueSoon })
  }

  return (
    <main className="app-page">
      {toast && (
        <div role="status" className="fixed right-5 top-5 z-[80] flex items-center gap-2 rounded-xl border border-success/30 bg-surface-elevated px-4 py-3 text-sm font-semibold text-success shadow-card">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-xs text-surface">✓</span>
          {toast}
        </div>
      )}

      <div className="page-container">
        <header className="page-header">
          <div><p className="page-eyebrow">Account settings</p>
          <h1 className="page-title">Your profile</h1>
          <p className="page-description">Keep your plan and reminders in step with your life.</p></div>
        </header>

        {profileQuery.isError && profileQuery.data && <section role="alert" className="mb-5"><p className="text-sm text-danger">Unable to refresh your profile. <button type="button" className="font-bold underline" onClick={() => profileQuery.refetch()}>Try again</button></p></section>}
        {profileQuery.isPending ? (
          <ProfileSkeleton />
        ) : error ? (
          <section role="alert" className="rounded-card border border-danger/30 bg-danger/10 px-6 py-10 text-center">
            <h2 className="font-display text-xl font-bold">Profile unavailable</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ink-secondary">{apiError(error, 'Unable to load your profile.')}</p>
            <button type="button" onClick={() => profileQuery.refetch()} className="action-button mt-6">Try again</button>
          </section>
        ) : profile ? (
          <FetchingSurface active={profileQuery.isFetching && !profileQuery.isPending} label="Refreshing your profile">
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
          </FetchingSurface>
        ) : null}
      </div>
    </main>
  )
}

export default Profile
