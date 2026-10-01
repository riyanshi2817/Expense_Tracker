import { apiError, validEmail } from '../utils/validation'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'

function Signup() {
  const { signup, token } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
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

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Name, email, and password are required.')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (!validEmail(form.email)) {
      setError('Enter a valid email address, for example you@example.com.')
      return
    }

    try {
      setSubmitting(true)
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      navigate('/home', { replace: true })
    } catch (requestError) {
      setError(
        apiError(requestError, 'Unable to create your account. Please try again.'),
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
          <h1 className="font-display text-3xl font-bold">Start with clarity</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Create your account and build a calmer money routine.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <label className="block text-sm font-medium text-ink-secondary">
            Name
            <input
              className="mt-2 w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              name="name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              placeholder="Your name"
              required
            />
          </label>

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
              autoComplete="new-password"
              minLength={6}
              placeholder="At least 6 characters"
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
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-secondary">
          Already have an account?{' '}
          <Link className="font-semibold text-accent-soft hover:text-ink" to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}

export default Signup
