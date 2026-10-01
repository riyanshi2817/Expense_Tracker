import { NavLink } from 'react-router-dom'
import NotificationBell from './NotificationBell'

const items = [
  { to: '/home', label: 'Home', icon: 'home' },
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
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-1 border-t border-border bg-surface-elevated/95 px-2 py-2 backdrop-blur-xl lg:inset-y-0 lg:left-0 lg:right-auto lg:flex lg:w-24 lg:flex-col lg:items-stretch lg:border-r lg:border-t-0 lg:px-3 lg:py-6">
      <div className="mb-9 hidden h-11 w-11 items-center justify-center self-center rounded-2xl bg-accent font-display text-lg font-bold text-white shadow-glow lg:flex">
        C
      </div>
      <div className="order-last shrink-0 px-1 lg:order-none lg:mb-6 lg:self-center lg:px-0">
        <NotificationBell />
      </div>
      <ul className="flex min-w-0 flex-1 items-center justify-around gap-1 lg:flex-1 lg:flex-col lg:justify-start lg:gap-3">
        {items.map((item) => (
          <li key={item.to} className="flex-1 lg:w-full lg:flex-none">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[0.68rem] font-medium transition lg:py-3 ${
                  isActive
                    ? 'bg-accent/15 text-accent-soft'
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
    </nav>
  )
}

export default AppNavigation
