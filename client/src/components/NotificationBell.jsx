import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryFns, queryKeys } from '../api/queries'
import { useAuth } from '../context/authContext'
import { LoadingState, ErrorState, EmptyState } from './Feedback'
import Modal from './Modal'
import DebitConfirmation from './DebitConfirmation'

let lastChimeAt = 0

function playNotificationSound() {
  if (Date.now() - lastChimeAt < 1000) return
  lastChimeAt = Date.now()
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return

  const audioContext = new AudioContextClass()
  const playChime = () => {
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    const now = audioContext.currentTime

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, now)
    oscillator.frequency.setValueAtTime(1175, now + 0.1)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.addEventListener('ended', () => audioContext.close().catch(() => {}), { once: true })
    oscillator.start(now)
    oscillator.stop(now + 0.23)
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume().then(playChime).catch(() => audioContext.close().catch(() => {}))
  } else {
    playChime()
  }
}

export default function NotificationBell() {
  const { user } = useAuth()
  const enabled = user?.notificationPrefs?.dueDateAlerts ?? user?.notificationPrefs?.dueDateReminders ?? true
  const dueSoonQuery = useQuery({ queryKey: queryKeys.dueSoon, queryFn: queryFns.dueSoon, enabled, refetchInterval: 5 * 60 * 1000 })
  const serverEnabled = dueSoonQuery.data?.enabled !== false
  const subscriptions = dueSoonQuery.data?.subscriptions || []
  const [open, setOpen] = useState(false)
  const loading = dueSoonQuery.isPending
  const error = dueSoonQuery.isError && !dueSoonQuery.data
  const previousDueSoonCount = useRef(null)

  useEffect(() => {
    if (!enabled) {
      previousDueSoonCount.current = null
      return undefined
    }

    const nextCount = subscriptions.length
    if (serverEnabled && previousDueSoonCount.current !== null && nextCount > previousDueSoonCount.current) playNotificationSound()
    previousDueSoonCount.current = nextCount
  }, [enabled, serverEnabled, dueSoonQuery.dataUpdatedAt, subscriptions.length])
  const alertsOn = enabled && serverEnabled
  const urgent = [...subscriptions].sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0]
  const showDebit = alertsOn && !loading && !error && urgent
  return <>
    <button type="button" aria-label="Upcoming debit notifications" aria-haspopup="dialog" aria-expanded={open} onClick={() => { setOpen(true); if (enabled && dueSoonQuery.isStale) dueSoonQuery.refetch() }} className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface-elevated text-ink-secondary shadow-card hover:border-accent">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></svg>
      {alertsOn && !error && subscriptions.length > 0 && <span data-testid="debit-badge" className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-dangerfill px-1 text-[0.65rem] font-bold text-white">{subscriptions.length > 9 ? '9+' : subscriptions.length}</span>}
    </button>
    {showDebit ? <DebitConfirmation debit={urgent} open={open} onClose={() => setOpen(false)} /> : <Modal open={open} onClose={() => setOpen(false)} title="Debit reminders">
      {!alertsOn ? <EmptyState title="Due-date reminders are off" /> : loading ? <LoadingState label="Loading notifications" compact /> : error ? <ErrorState message="Unable to check upcoming debits. Please try again." onRetry={() => dueSoonQuery.refetch()} /> : <EmptyState title="Nothing due in the next 24 hours" />}
    </Modal>}
  </>
}
