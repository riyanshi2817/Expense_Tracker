import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/authContext'
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
    home: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>,
    spark: <><path d="m4 17 5-5 4 3 7-8" /><path d="M15 7h5v5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  }
  return <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Brand() {
  return <Link to="/home" className="app-brand" aria-label="ClearCash overview"><span className="app-brand-mark">C</span><span>clearcash<span className="app-brand-dot">.</span></span></Link>
}

function AppNavigation() {
  const { user } = useAuth()

  return <>
    <header className="mobile-topbar">
      <Brand />
      <div className="mobile-topbar-actions"><ThemeToggle /><NotificationBell /></div>
    </header>

    <aside className="desktop-sidebar">
      <Brand />
      <nav aria-label="Main navigation" className="sidebar-nav">
        <p className="sidebar-label">Workspace</p>
        <ul>{items.map((item) => <li key={item.to}><NavLink to={item.to} className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}><NavIcon name={item.icon} /><span>{item.label}</span></NavLink></li>)}</ul>
      </nav>
      <div className="sidebar-footer">
        <Link to="/profile" className="sidebar-account"><span className="sidebar-avatar" aria-hidden="true">{user?.name?.trim()?.[0]?.toUpperCase() || 'C'}</span><span className="sidebar-account-copy"><strong>{user?.name || 'Your account'}</strong><small>View profile</small></span><svg className="sidebar-account-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg></Link>
        <div className="sidebar-tools" role="group" aria-label="Quick controls"><ThemeToggle /><NotificationBell /></div>
      </div>
    </aside>

    <nav aria-label="Main navigation" className="mobile-tabbar">
      <ul>{items.map((item) => <li key={item.to}><NavLink to={item.to} className={({ isActive }) => `mobile-tab${isActive ? ' is-active' : ''}`}><NavIcon name={item.icon} /><span>{item.label}</span></NavLink></li>)}</ul>
    </nav>
  </>
}

export default AppNavigation
