import { apiError } from '../utils/validation'
import { useState } from 'react'
import client from '../api/client'

const preferenceOptions = [
  {
    key: 'dueDateAlerts',
    label: 'Due-date reminders',
    description: 'Warn me when a subscription debit is due within 24 hours.',
  },
  {
    key: 'unusualSpendingAlerts',
    label: 'Unusual spending alerts',
    description: 'Highlight expenses that are well above my normal category spend.',
  },
  {
    key: 'weeklySummary',
    label: 'Weekly summary',
    description: 'Include the last seven days in your Insights digest.',
  },
]

function NotificationPrefs({ preferences, onUpdated, onSuccess }) {
  const [localPreferences, setLocalPreferences] = useState(preferences)
  const [pendingKey, setPendingKey] = useState('')
  const [error, setError] = useState('')

  const togglePreference = async (key) => {
    if (pendingKey) return
    const previous = localPreferences
    const nextValue = !localPreferences[key]
    const nextPreferences = { ...localPreferences, [key]: nextValue }

    setLocalPreferences(nextPreferences)
    setPendingKey(key)
    setError('')

    try {
      const { data } = await client.put('/api/users/me', {
        notificationPrefs: { [key]: nextValue },
      })
      setLocalPreferences(data.user.notificationPrefs)
      onUpdated(data.user)
      onSuccess('Notification preference updated')
    } catch (requestError) {
      setLocalPreferences(previous)
      setError(apiError(requestError, 'Unable to update notifications.'))
    } finally {
      setPendingKey('')
    }
  }

  return (
    <section className="app-card notification-panel">
      <div>
        <h2 className="app-card-title">Notifications</h2>
        <p className="mt-1 text-sm text-ink-secondary">Choose which reminders and insights you see.</p>
      </div>

      <div className="mt-6 divide-y divide-border">
        {preferenceOptions.map((option) => {
          const enabled = Boolean(localPreferences[option.key])

          return (
            <div key={option.key} className="flex items-center justify-between gap-5 py-5 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-ink">{option.label}</p>
                <p className="mt-1 max-w-lg text-xs leading-5 text-ink-muted">{option.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={option.label}
                disabled={Boolean(pendingKey)}
                onClick={() => togglePreference(option.key)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? 'bg-accent' : 'bg-surface-muted'} disabled:cursor-wait disabled:opacity-60`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          )
        })}
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
    </section>
  )
}

export default NotificationPrefs
