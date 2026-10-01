import { Link } from 'react-router-dom'
import Spinner from './Spinner'

export function LoadingState({ label = 'Loading your data', compact = false }) {
  return <div role="status" aria-live="polite" aria-busy="true" className={compact ? 'space-y-3 p-3' : 'grid gap-5 sm:grid-cols-2'}>
    <span className="sr-only">{label}...</span>
    {Array.from({ length: compact ? 2 : 4 }, (_, index) => <div key={index} aria-hidden="true" className={`skeleton rounded-2xl ${compact ? 'h-14' : 'h-48'}`} />)}
  </div>
}

function Line({ width = '100%', height = 12 }) {
  return <span className="skeleton block rounded-full" style={{ width, height }} />
}

export function FetchingSurface({ active, label = 'Refreshing content', children }) {
  return <div className={`fetching-surface${active ? ' is-fetching' : ''}`}>
    <div className="fetching-surface-content" aria-busy={active}>{children}</div>
    {active && <div className="fetching-surface-overlay" role="status"><span className="sr-only">{label}</span><span className="fetching-surface-spinner"><Spinner /></span></div>}
  </div>
}

export function DashboardSkeleton() {
  return <div role="status" aria-busy="true" className="space-y-5"><span className="sr-only">Loading dashboard</span>
    <div className="overview-lead-grid"><div className="app-card skeleton-card skeleton-hero"><Line width="32%" /><Line width="56%" height={62} /><Line width="68%" /><div className="skeleton-rule" /><div className="skeleton-columns"><Line /><Line /><Line /></div></div><div className="overview-side-stack"><div className="app-card skeleton-card skeleton-health"><Line width="55%" /><Line width="30%" height={36} /><Line width="100%" /></div><div className="overview-metrics"><div className="app-card skeleton-card"><Line width="70%" /><Line width="50%" height={30} /></div><div className="app-card skeleton-card"><Line width="70%" /><Line width="50%" height={30} /></div></div></div></div>
  </div>
}

export function TransactionsSkeleton() {
  return <div role="status" aria-busy="true" className="transaction-skeleton"><span className="sr-only">Loading transactions</span>{Array.from({ length: 4 }, (_, index) => <div className="transaction-skeleton-row" key={index}><span className="skeleton rounded-xl" style={{ width: 38, height: 38 }} /><div><Line width="42%" /><Line width="68%" height={10} /></div><Line width="75%" /></div>)}</div>
}

export function SubscriptionsSkeleton() {
  return <div role="status" aria-busy="true"><span className="sr-only">Loading subscriptions</span><div className="subscription-summary-grid"><div className="app-card skeleton-card skeleton-summary"><Line width="45%" /><Line width="65%" height={40} /><Line width="80%" /></div><div className="app-card skeleton-card skeleton-summary"><Line width="45%" /><Line width="65%" height={40} /><Line width="80%" /></div></div><div className="skeleton-list">{Array.from({ length: 3 }, (_, index) => <div className="app-card skeleton-card skeleton-subscription" key={index}><div className="skeleton-subscription-main"><span className="skeleton rounded-xl" style={{ width: 42, height: 42 }} /><div><Line width="55%" /><Line width="75%" height={10} /></div><Line width="80%" /></div><div className="skeleton-rule" /><Line width="45%" height={10} /></div>)}</div></div>
}

export function InsightsSkeleton() {
  return <div role="status" aria-busy="true"><span className="sr-only">Loading insights</span><div className="app-card skeleton-card skeleton-chart"><Line width="32%" /><div className="skeleton-chart-bars">{[42, 70, 54, 90, 66, 82, 58].map((height, index) => <span key={index} className="skeleton" style={{ height: `${height}%` }} />)}</div></div><div className="insights-grid skeleton-insights-grid">{Array.from({ length: 4 }, (_, index) => <div className="app-card skeleton-card skeleton-summary" key={index}><Line width="50%" /><Line width="78%" /><Line width="60%" /></div>)}</div></div>
}

export function ChartSkeleton() {
  return <div role="status" aria-busy="true" className="app-card skeleton-card skeleton-chart"><span className="sr-only">Loading chart</span><Line width="32%" /><div className="skeleton-chart-bars">{[42, 70, 54, 90, 66, 82, 58].map((height, index) => <span key={index} className="skeleton" style={{ height: `${height}%` }} />)}</div></div>
}

export function ProfileSkeleton() {
  return <div role="status" aria-busy="true"><span className="sr-only">Loading profile</span><div className="app-card skeleton-card skeleton-identity"><span className="skeleton rounded-xl" style={{ width: 56, height: 56 }} /><div><Line width="9rem" /><Line width="13rem" height={10} /></div></div><div className="settings-grid"><div className="app-card skeleton-card skeleton-settings"><Line width="45%" height={20} /><Line width="80%" /><Line height={44} /><Line height={44} /></div><div className="app-card skeleton-card skeleton-settings"><Line width="45%" height={20} /><Line width="80%" /><Line height={40} /><Line height={40} /><Line height={40} /></div></div></div>
}

export function ErrorState({ message, onRetry }) {
  if (!message) return null
  return <div role="alert" className="my-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
    <p className="min-w-0 flex-1">{message}</p>
    {onRetry && <button type="button" className="shrink-0 rounded-lg px-3 py-2 font-bold" onClick={onRetry}>Try again</button>}
  </div>
}

export function EmptyState({ title, children, to, actionLabel, onAction }) {
  return <div className="empty-state">
    <p className="font-semibold text-ink">{title}</p>
    {children && <p className="mt-2 text-sm leading-6 text-ink-secondary">{children}</p>}
    {actionLabel && (to ? <Link className="quiet-button mt-4 inline-flex" to={to}>{actionLabel}</Link> : <button type="button" className="quiet-button mt-4" onClick={onAction}>{actionLabel}</button>)}
  </div>
}
