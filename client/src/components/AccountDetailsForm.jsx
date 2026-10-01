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
    <section className="app-card account-details-panel">
      <div>
        <h2 className="app-card-title">Monthly plan</h2>
        <p className="mt-1 text-sm text-ink-secondary">These numbers power your daily spending estimate.</p>
      </div>

      <form noValidate onSubmit={handleSubmit} className="account-details-form">
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
          <button type="submit" disabled={saving} className="action-button">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default AccountDetailsForm
