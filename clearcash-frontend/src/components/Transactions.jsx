import { useEffect, useState } from 'react'
import client from '../api/client'
import { apiError } from '../utils/validation'
import EntryForm from './EntryForm'
import { LoadingState, ErrorState, EmptyState } from './Feedback'

export default function Transactions({ onChanged }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [editing, setEditing] = useState(null)
  const [pending, setPending] = useState('')
  const [confirming, setConfirming] = useState('')
  const [limit, setLimit] = useState(10)
  useEffect(() => {
    let active = true
    const load = async () => {
    setLoading(true); setError('')
    await client.get('/api/transactions').then(({ data }) => { if (active) setItems(data.transactions || []) })
      .catch((err) => { if (active) setError(apiError(err, 'Unable to load transactions.')) })
      .finally(() => { if (active) setLoading(false) })
    }
    load()
    return () => { active = false }
  }, [refresh])
  async function save(values) {
    if (editing) await client.put('/api/transactions/' + editing._id, values)
    else await client.post('/api/transactions', values)
    setEditing(null); setRefresh((value) => value + 1); onChanged()
  }
  async function remove(id) {
    if (pending) return
    setPending(id); setMutationError('')
    try {
      await client.delete('/api/transactions/' + id)
      setItems((current) => current.filter((item) => item._id !== id)); setConfirming(''); onChanged()
      if (editing?._id === id) setEditing(null)
    } catch (err) { setMutationError(apiError(err, 'Unable to delete transaction.')) }
    finally { setPending('') }
  }
  return <section id="transactions" className="mt-6 rounded-card border border-border bg-surface-elevated p-5 sm:p-7">
    <h2 className="mb-5 font-display text-xl font-bold">Transactions</h2>
    <EntryForm key={editing?._id || 'new'} kind="transaction" initial={editing} onSave={save} onCancel={editing ? () => setEditing(null) : undefined} />
    <ErrorState message={mutationError} />
    {loading ? <div className="mt-6"><LoadingState label="Loading transactions" compact /></div> : error ? <ErrorState message={error} onRetry={() => setRefresh((value) => value + 1)} /> : !items.length ? <EmptyState title="No transactions yet" actionLabel="Add your first transaction" onAction={() => document.querySelector('#transactions input')?.focus()}>Start with today's income or an expense.</EmptyState> : <>
      <ul className="mt-6 divide-y divide-border">{items.slice(0, limit).map((item) => <li key={item._id} className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0 flex-1"><p className="font-semibold">{item.category}</p><p className="text-sm text-ink-secondary">{item.description}</p><p className="text-xs text-ink-muted">{new Date(item.date).toLocaleDateString('en-IN')}</p></div>
        <p className={item.type === 'income' ? 'text-success' : 'text-ink'}>{item.type === 'income' ? '+' : '-'}{Number(item.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
        <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
          <button type="button" disabled={Boolean(pending)} className="px-3 py-2 text-sm text-accent-soft" onClick={() => { setEditing(item); document.getElementById('transactions')?.scrollIntoView({ block: 'start' }) }}>Edit</button>
          {confirming === item._id ? <><button type="button" disabled={Boolean(pending)} className="px-3 py-2 text-sm" onClick={() => setConfirming('')}>Cancel</button><button type="button" disabled={Boolean(pending)} className="px-3 py-2 text-sm text-danger" onClick={() => remove(item._id)}>{pending === item._id ? 'Deleting...' : 'Confirm delete'}</button></> : <button type="button" disabled={Boolean(pending)} className="px-3 py-2 text-sm text-danger" onClick={() => setConfirming(item._id)}>Delete</button>}
        </div>
      </li>)}</ul>
      {items.length > limit && <button type="button" className="action-button mt-4" onClick={() => setLimit((value) => value + 10)}>Show more transactions</button>}
    </>}
  </section>
}
