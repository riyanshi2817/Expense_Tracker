import { useState } from 'react'
import { validAmount } from '../utils/validation'

const emptyGoal = { name: '', targetAmount: '', currentAmount: '0' }

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

function GoalFields({ values, onChange, idPrefix }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-xs font-semibold text-ink-secondary sm:col-span-3">
        Goal name
        <input id={`${idPrefix}-name`} name="name" value={values.name} onChange={onChange} placeholder="Emergency fund" className="mt-1.5 w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-ink outline-none focus:border-accent" required />
      </label>
      <label className="text-xs font-semibold text-ink-secondary">
        Target amount
        <input name="targetAmount" type="number" min="0.01" step="0.01" value={values.targetAmount} onChange={onChange} className="mt-1.5 w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-ink outline-none focus:border-accent" required />
      </label>
      <label className="text-xs font-semibold text-ink-secondary">
        Current amount
        <input name="currentAmount" type="number" min="0" step="0.01" value={values.currentAmount} onChange={onChange} className="mt-1.5 w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-ink outline-none focus:border-accent" required />
      </label>
    </div>
  )
}

function GoalsList({ goals = [], onCreate, onUpdate, onDelete }) {
  const [newGoal, setNewGoal] = useState(emptyGoal)
  const [editingId, setEditingId] = useState(null)
  const [editGoal, setEditGoal] = useState(emptyGoal)
  const [confirmingId, setConfirmingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const updateValues = (setter) => (event) => {
    setter((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const validate = (values) => {
    if (!values.name.trim() || !validAmount(values.targetAmount)) return 'Enter a name and positive target.'
    if (!validAmount(values.currentAmount, 0)) return 'Enter a current amount of zero or more.'
    if (Number(values.currentAmount) > Number(values.targetAmount)) return 'Current amount cannot exceed the target.'
    return ''
  }

  const submitNewGoal = async (event) => {
    event.preventDefault()
    if (busy) return
    const validationError = validate(newGoal)
    if (validationError) {
      setFormError(validationError)
      return
    }
    setBusy(true)
    const saved = await onCreate({ ...newGoal, targetAmount: Number(newGoal.targetAmount), currentAmount: Number(newGoal.currentAmount) })
    if (saved) {
      setNewGoal(emptyGoal)
      setFormError('')
    }
    setBusy(false)
  }

  const beginEdit = (goal) => {
    setEditingId(goal._id)
    setEditGoal({ name: goal.name, targetAmount: String(goal.targetAmount), currentAmount: String(goal.currentAmount) })
    setFormError('')
  }

  const submitEdit = async (event) => {
    event.preventDefault()
    if (busy) return
    const validationError = validate(editGoal)
    if (validationError) {
      setFormError(validationError)
      return
    }
    setBusy(true)
    const saved = await onUpdate(editingId, { ...editGoal, targetAmount: Number(editGoal.targetAmount), currentAmount: Number(editGoal.currentAmount) })
    if (saved) {
      setEditingId(null)
      setFormError('')
    }
    setBusy(false)
  }

  return (
    <section className="rounded-card border border-border bg-surface-elevated p-6 shadow-card lg:p-7">
      <div>
        <h2 className="font-display text-xl font-bold">Savings goals</h2>
        <p className="mt-1 text-sm text-ink-secondary">Turn progress into something you can see.</p>
      </div>

      <form noValidate onSubmit={submitNewGoal} className="mt-6 rounded-2xl border border-border bg-surface/35 p-4">
        <GoalFields values={newGoal} onChange={updateValues(setNewGoal)} idPrefix="new-goal" />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p role="alert" className="text-xs text-danger">{!editingId && formError}</p>
          <button type="submit" disabled={busy} className="ml-auto rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving...' : 'Add goal'}</button>
        </div>
      </form>

      {goals.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-ink-secondary">No goals yet. Add your first one above. <button type="button" className="mt-3 block w-full text-accent-soft" onClick={() => document.getElementById('new-goal-name')?.focus()}>Create your first goal</button></p>
      ) : (
        <ul className="mt-6 space-y-4">
          {goals.map((goal) => {
            const progress = Math.min((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100, 100)
            return (
              <li key={goal._id} className="rounded-2xl border border-border bg-surface/35 p-4">
                {editingId === goal._id ? (
                  <form noValidate onSubmit={submitEdit}>
                    <GoalFields values={editGoal} onChange={updateValues(setEditGoal)} idPrefix={`edit-${goal._id}`} />
                    <p role="alert" className="mt-2 text-xs text-danger">{formError}</p>
                    <div className="mt-3 flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingId(null)} className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-secondary">Cancel</button>
                      <button type="submit" disabled={busy} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving...' : 'Save'}</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{goal.name}</p>
                        <p className="mt-1 text-xs text-ink-muted">{formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}</p>
                      </div>
                      <p className="text-sm font-bold text-accent-soft">{progress.toFixed(0)}%</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button type="button" onClick={() => beginEdit(goal)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-secondary hover:bg-surface-muted">Edit</button>
                      {confirmingId === goal._id ? (
                        <>
                          <button type="button" onClick={() => setConfirmingId(null)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink-muted">Cancel</button>
                          <button type="button" disabled={busy} onClick={async () => { setBusy(true); await onDelete(goal._id); setBusy(false); setConfirmingId(null) }} className="rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Confirm</button>
                        </>
                      ) : (
                        <button type="button" onClick={() => setConfirmingId(goal._id)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/10">Delete</button>
                      )}
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default GoalsList
