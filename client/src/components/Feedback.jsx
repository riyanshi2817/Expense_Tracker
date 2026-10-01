import { Link } from 'react-router-dom'

export function LoadingState({ label = 'Loading your data', compact = false }) {
  return <div role="status" aria-live="polite" aria-busy="true" className={compact ? 'space-y-3 p-3' : 'grid gap-5 sm:grid-cols-2'}>
    <span className="sr-only">{label}...</span>
    {Array.from({ length: compact ? 2 : 4 }, (_, index) => <div key={index} aria-hidden="true" className={`animate-pulse rounded-2xl border border-border bg-surface-muted ${compact ? 'h-14' : 'h-48'}`} />)}
  </div>
}

export function ErrorState({ message, onRetry }) {
  if (!message) return null
  return <div role="alert" className="my-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
    <p className="min-w-0 flex-1">{message}</p>
    {onRetry && <button type="button" className="shrink-0 rounded-lg px-3 py-2 font-bold" onClick={onRetry}>Try again</button>}
  </div>
}

export function EmptyState({ title, children, to, actionLabel, onAction }) {
  return <div className="my-5 rounded-2xl border border-dashed border-border p-5 text-center">
    <p className="font-semibold text-ink">{title}</p>
    {children && <p className="mt-2 text-sm leading-6 text-ink-secondary">{children}</p>}
    {actionLabel && (to ? <Link className="action-button mt-4 inline-flex" to={to}>{actionLabel}</Link> : <button type="button" className="action-button mt-4" onClick={onAction}>{actionLabel}</button>)}
  </div>
}
