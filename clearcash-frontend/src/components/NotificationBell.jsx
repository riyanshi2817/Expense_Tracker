import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/authContext'
import { LoadingState, ErrorState, EmptyState } from './Feedback'
import Modal from './Modal'
import DebitConfirmation from './DebitConfirmation'

export default function NotificationBell() {
  const { logout, user } = useAuth()
  const enabled = user?.notificationPrefs?.dueDateAlerts ?? user?.notificationPrefs?.dueDateReminders ?? true
  const [serverEnabled, setServerEnabled] = useState(true)
  const [subscriptions, setSubscriptions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    async function load() {
      setLoading(true)
      try {
        const { data } = await client.get('/api/subscriptions/due-soon')
        if (!active) return
        setSubscriptions(data.subscriptions || [])
        setServerEnabled(data.enabled !== false)
        setError('')
      } catch (err) {
        if (!active) return
        if (err.response?.status === 401) { logout(); return }
        setError('Unable to check upcoming debits. Please try again.')
      } finally { if (active) setLoading(false) }
    }
    load()
    const interval = window.setInterval(load, 5 * 60 * 1000)
    return () => { active = false; window.clearInterval(interval) }
  }, [enabled, logout, refresh])
  const alertsOn = enabled && serverEnabled
  const urgent = [...subscriptions].sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0]
  const showDebit = alertsOn && !loading && !error && urgent
  return <>
    <button type="button" aria-label="Upcoming debit notifications" aria-haspopup="dialog" aria-expanded={open} onClick={() => { setOpen(true); setRefresh((value) => value + 1) }} className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface-elevated text-ink-secondary shadow-card hover:border-accent">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></svg>
      {alertsOn && !error && subscriptions.length > 0 && <span data-testid="debit-badge" className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[0.65rem] font-bold text-white">{subscriptions.length > 9 ? '9+' : subscriptions.length}</span>}
    </button>
    {showDebit ? <DebitConfirmation debit={urgent} open={open} onClose={() => setOpen(false)} /> : <Modal open={open} onClose={() => setOpen(false)} title="Debit reminders">
      {!alertsOn ? <EmptyState title="Due-date reminders are off" /> : loading ? <LoadingState label="Loading notifications" compact /> : error ? <ErrorState message={error} onRetry={() => setRefresh((value) => value + 1)} /> : <EmptyState title="Nothing due in the next 24 hours" />}
    </Modal>}
  </>
}
