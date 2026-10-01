import { apiError } from '../utils/validation'
import { useState } from 'react'
import client from '../api/client'

function AccountDetailsForm({ profile, onUpdated, onSuccess }) {
  const [values, setValues] = useState({
    salary: String(profile.salary ?? 0),
    fixedCommitments: String(profile.fixedCommitments ?? 0),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    setError('')

    const salary = Number(values.salary)
    const fixedCommitments = Number(values.fixedCommitments)

    if (!values.salary.trim() || !Number.isFinite(salary) || salary < 0) {
      setError('Salary must be a non-negative number.')
      return
    }

    if (!values.fixedCommitments.trim() || !Number.isFinite(fixedCommitments) || fixedCommitments < 0) {
      setError('Fixed commitments must be a non-negative number.')
      return
    }

    try {
      setSaving(true)
      const { data } = await client.put('/api/users/me', {
        salary,
        fixedCommitments,
      })
      onUpdated(data.user)
      onSuccess('Account details saved')
    } catch (requestError) {
      setError(apiError(requestError, 'Unable to save account details.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-card border border-border bg-surface-elevated p-6 shadow-card sm:p-7">
      <div>
        <h2 className="font-display text-xl font-bold">Account details</h2>
        <p className="mt-1 text-sm text-ink-secondary">Keep your monthly plan grounded in the right numbers.</p>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-surface/35 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Name</p>
          <p className="mt-1 truncate font-medium text-ink">{profile.name}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Email</p>
          <p className="mt-1 truncate font-medium text-ink">{profile.email}</p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="block text-sm font-semibold text-ink-secondary">
          Monthly salary
          <div className="relative mt-2">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-muted">₹</span>
            <input
              type="number"
              name="salary"
              min="0"
              step="0.01"
              value={values.salary}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-surface-muted py-3 pl-9 pr-4 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>
        </label>

        <label className="block text-sm font-semibold text-ink-secondary">
          Monthly fixed commitments
          <div className="relative mt-2">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-ink-muted">₹</span>
            <input
              type="number"
              name="fixedCommitments"
              min="0"
              step="0.01"
              value={values.fixedCommitments}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-surface-muted py-3 pl-9 pr-4 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>
          <span className="mt-2 block text-xs font-normal text-ink-muted">Rent, EMIs, insurance, and other unavoidable monthly costs.</span>
        </label>

        {error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-accent-soft disabled:cursor-wait disabled:opacity-60">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default AccountDetailsForm
