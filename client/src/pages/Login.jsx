import { apiError, validEmail } from '../utils/validation'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import ThemeToggle from '../components/ThemeToggle'

function Login() {
  const { login, token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(() => sessionStorage.getItem('clearcash_session_message') || '')
  const [submitting, setSubmitting] = useState(false)

  if (token) {
    return <Navigate to="/home" replace />
  }

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const signIn = async (credentials) => {
    if (submitting) return
    setError('')
    try {
      setSubmitting(true)
      sessionStorage.removeItem('clearcash_session_message')
      await login(credentials)
      navigate(location.state?.from?.pathname || '/home', { replace: true })
    } catch (requestError) {
      setError(
        apiError(requestError, 'Unable to log in. Check your details and try again.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (submitting) return

    if (!form.email.trim() || !form.password) {
      setError('Email and password are required.')
      return
    }

    if (!validEmail(form.email)) {
      setError('Enter a valid email address, for example you@example.com.')
      return
    }

    signIn({ email: form.email.trim(), password: form.password })
  }

  return (
    <main className="auth-page">
      <div className="auth-theme-toggle"><ThemeToggle showLabel /></div>
      <aside className="auth-story">
        <Link to="/login" className="auth-brand"><span className="auth-brand-mark">C</span> clearcash<span className="auth-brand-dot">.</span></Link>
        <div><p className="auth-kicker">Money, made clear</p><h2>Make room for what matters.</h2><p>Understand your spending, stay ahead of recurring costs, and find a little more breathing room each month.</p></div>
        <p className="auth-footnote">A calmer way to stay on top of your money.</p>
      </aside>
      <section className="auth-form-panel">
      <div className="auth-form-card">
        <div className="mb-8">
          <p className="page-eyebrow">Welcome back</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Sign in to see what is safe to spend today.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <label className="block text-sm font-medium text-ink-secondary">
            Email
            <input
              className="form-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block text-sm font-medium text-ink-secondary">
            Password
            <input
              className="form-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Your password"
              required
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            className="action-button w-full"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            className="quiet-button w-full"
            type="button"
            onClick={() => signIn({ email: 'guest@gmail.com', password: 'guest123' })}
            disabled={submitting}
          >
            Login as guest
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-secondary">
          New to ClearCash?{' '}
          <Link className="font-semibold text-accent-soft hover:text-ink" to="/signup">
            Create an account
          </Link>
        </p>
      </div>
      </section>
    </main>
  )
}

export default Login
