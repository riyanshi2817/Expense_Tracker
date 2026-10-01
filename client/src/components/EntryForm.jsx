import { useId, useRef, useState } from 'react'
import { apiError, validateEntry } from '../utils/validation'
import { ErrorState } from './Feedback'
import Spinner from './Spinner'

function defaults(kind) {
  const today = new Date()
  const date = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  return kind === 'transaction' ? { amount: '', category: '', description: '', date, type: 'expense' } : { name: '', amount: '', billingCycle: 'monthly', nextDueDate: date, status: 'active' }
}

export default function EntryForm({ kind, initial, onSave, onCancel }) {
  const id = useId()
  const [values, setValues] = useState(() => ({ ...defaults(kind), ...initial, ...(initial ? { [kind === 'transaction' ? 'date' : 'nextDueDate']: (initial.date || initial.nextDueDate).slice(0, 10) } : {}) }))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState('')
  const submitting = useRef(false)
  const fields = kind === 'transaction' ? [
    ['amount', 'Amount (INR)', 'number'], ['category', 'Category', 'text'], ['date', 'Date', 'date'],
    ['type', 'Type', ['expense', 'income']], ['description', 'Description (optional)', 'text'],
  ] : [
    ['name', 'Subscription name', 'text'], ['amount', 'Amount (INR)', 'number'],
    ['billingCycle', 'Billing cycle', ['monthly', 'yearly']], ['nextDueDate', 'Next due date', 'date'], ['status', 'Status', ['active', 'unused']],
  ]
  async function submit(event) {
    event.preventDefault()
    if (submitting.current) return
    const nextErrors = validateEntry(kind, values)
    setErrors(nextErrors); setError(''); setSuccess('')
    if (Object.keys(nextErrors).length) {
      event.currentTarget.elements.namedItem(Object.keys(nextErrors)[0])?.focus()
      return
    }
    submitting.current = true; setBusy(true)
    try {
      const payload = Object.fromEntries(fields.map(([name]) => [name, typeof values[name] === 'string' ? values[name].trim() : values[name]]))
      payload.amount = Number(payload.amount)
      await onSave(payload)
      if (!initial) setValues(defaults(kind))
      setSuccess(initial ? 'Changes saved.' : 'Added successfully.')
    } catch (requestError) { setError(apiError(requestError, 'Unable to save. Your entries are kept; please try again.')) }
    finally { submitting.current = false; setBusy(false) }
  }
  return <form onSubmit={submit} noValidate aria-label={`${initial ? 'Edit' : 'Add'} ${kind}`}>
    <fieldset disabled={busy} className="entry-fieldset">
      <legend className="app-card-title">{initial ? 'Edit' : 'New'} {kind}</legend>
      <p className="entry-form-intro">{kind === 'transaction' ? 'Record the details once so your overview stays accurate.' : 'Add the renewal details to keep upcoming payments visible.'}</p>
      <div className="entry-form-grid">
      {fields.map(([name, label, type]) => {
        const props = { id: id + name, name, value: values[name], onChange: (event) => setValues((current) => ({ ...current, [name]: event.target.value })), className: 'form-input', 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? id + name + '-error' : undefined }
        return <div key={name} className={`entry-field${name === 'description' || name === 'name' ? ' entry-field--wide' : ''}`}><label htmlFor={id + name} className="entry-label">{label}</label>
          {Array.isArray(type) ? <select {...props}>{type.map((value) => <option key={value} value={value}>{value}</option>)}</select> : <input {...props} type={type} step={type === 'number' ? '0.01' : undefined} min={type === 'number' ? '0.01' : undefined} maxLength={type === 'text' ? 200 : undefined} />}
          {errors[name] && <p id={id + name + '-error'} className="mt-1 text-sm text-danger">{errors[name]}</p>}
        </div>
      })}
      </div>
    </fieldset>
    <ErrorState message={error} />
    {success && <p role="status" className="mt-3 text-sm text-success">{success}</p>}
    <div className="entry-form-actions">
      {onCancel && <button type="button" disabled={busy} className="quiet-button" onClick={onCancel}>Cancel</button>}
      <button className="action-button" disabled={busy} aria-busy={busy}>{busy && <Spinner />}{busy ? 'Saving…' : initial ? 'Save changes' : 'Add ' + kind}</button>
    </div>
  </form>
}
