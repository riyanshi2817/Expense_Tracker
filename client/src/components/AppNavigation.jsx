import { NavLink } from 'react-router-dom'
import NotificationBell from './NotificationBell'
import ThemeToggle from './ThemeToggle'

const items = [
  { to: '/home', label: 'Overview', icon: 'home' },
  { to: '/subscriptions', label: 'Subscriptions', icon: 'card' },
  { to: '/insights', label: 'Insights', icon: 'spark' },
  { to: '/profile', label: 'Profile', icon: 'user' },
]

function NavIcon({ name }) {
  const paths = {
    home: <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z" />,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>,
    spark: <><path d="m4 17 5-5 4 3 7-8" /><path d="M15 7h5v5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function AppNavigation() {
  return (
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-50 flex items-center border-t border-border bg-surface-elevated px-2 py-2 lg:inset-y-0 lg:left-0 lg:right-auto lg:w-[244px] lg:flex-col lg:items-stretch lg:border-r lg:border-t-0 lg:px-5 lg:py-7">
      <div className="mb-11 hidden items-center gap-3 px-2 lg:flex">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-xl font-black text-onprimary">C</span>
        <span className="font-display text-lg font-extrabold tracking-tight text-ink">clearcash<span className="text-success">.</span></span>
      </div>
      <p className="mb-3 hidden px-4 text-[11px] font-bold uppercase tracking-[.16em] text-ink-muted lg:block">Workspace</p>
      <ul className="flex min-w-0 flex-1 items-center justify-around gap-1 lg:flex-col lg:items-stretch lg:justify-start lg:gap-1">
        {items.map((item) => (
          <li key={item.to} className="min-w-0 flex-1 lg:w-full lg:flex-none">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[0.67rem] font-semibold transition lg:flex-row lg:gap-3 lg:px-4 lg:py-3 lg:text-sm ${
                  isActive
                    ? 'bg-accent text-onprimary'
                    : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                }`
              }
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="order-last flex shrink-0 items-center gap-2 px-1 lg:order-none lg:mt-auto lg:border-t lg:border-border lg:px-1 lg:pt-5">
        <ThemeToggle showLabel />
        <NotificationBell />
      </div>
    </nav>
  )
}

export default AppNavigation
