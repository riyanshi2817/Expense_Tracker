import { apiError, validEmail } from '../utils/validation'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'

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

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setError('')

    if (!form.email.trim() || !form.password) {
      setError('Email and password are required.')
      return
    }

    if (!validEmail(form.email)) {
      setError('Enter a valid email address, for example you@example.com.')
      return
    }

    try {
      setSubmitting(true)
      sessionStorage.removeItem('clearcash_session_message')
      await login({ email: form.email.trim(), password: form.password })
      navigate(location.state?.from?.pathname || '/home', { replace: true })
    } catch (requestError) {
      setError(
        apiError(requestError, 'Unable to log in. Check your details and try again.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-5 py-12 text-ink">
      <section className="w-full max-w-md rounded-card border border-border bg-surface-elevated p-7 shadow-card sm:p-9">
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-accent-soft">
            ClearCash
          </p>
          <h1 className="font-display text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Sign in to see what is safe to spend today.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <label className="block text-sm font-medium text-ink-secondary">
            Email
            <input
              className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
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
              className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
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
            className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-glow transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-secondary">
          New to ClearCash?{' '}
          <Link className="font-semibold text-accent-soft hover:text-ink" to="/signup">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  )
}

export default Login
