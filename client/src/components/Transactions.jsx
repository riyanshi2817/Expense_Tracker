import { useEffect, useRef, useState } from 'react'
import client from '../api/client'
import { apiError } from '../utils/validation'
import EntryForm from './EntryForm'
import { LoadingState, ErrorState, EmptyState } from './Feedback'

const money = (value) => Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const dateLabel = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Transactions({ onChanged, formOpen, onFormOpenChange }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mutationError, setMutationError] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [editing, setEditing] = useState(null)
  const [pending, setPending] = useState('')
  const [confirming, setConfirming] = useState('')
  const [limit, setLimit] = useState(8)
  const hasLoaded = useRef(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!hasLoaded.current) setLoading(true)
      setError('')
      try {
        const { data } = await client.get('/api/transactions')
        if (active) { setItems(data.transactions || []); hasLoaded.current = true }
      } catch (requestError) {
        if (active) setError(apiError(requestError, 'Unable to load transactions.'))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [refresh])

  const openNew = () => {
    setEditing(null)
    onFormOpenChange(true)
  }

  const closeForm = () => {
    setEditing(null)
    onFormOpenChange(false)
  }

  const save = async (values) => {
    if (editing) await client.put(`/api/transactions/${editing._id}`, values)
    else await client.post('/api/transactions', values)
    closeForm()
    setRefresh((value) => value + 1)
    onChanged()
  }

  const remove = async (id) => {
    if (pending) return
    setPending(id)
    setMutationError('')
    try {
      await client.delete(`/api/transactions/${id}`)
      setItems((current) => current.filter((item) => item._id !== id))
      setConfirming('')
      if (editing?._id === id) closeForm()
      onChanged()
    } catch (requestError) {
      setMutationError(apiError(requestError, 'Unable to delete transaction.'))
    } finally {
      setPending('')
    }
  }

  const openEdit = (item) => {
    setEditing(item)
    onFormOpenChange(true)
    requestAnimationFrame(() => document.getElementById('transaction-form')?.scrollIntoView({ block: 'start', behavior: 'smooth' }))
  }

  return <section id="transactions" className="app-card transaction-panel">
    <div className="panel-heading">
      <div><h2 className="app-card-title">Recent activity</h2><p>All of your recorded income and spending in one place.</p></div>
      <button type="button" className={formOpen ? 'quiet-button' : 'action-button'} onClick={formOpen ? closeForm : openNew} aria-expanded={formOpen} aria-controls="transaction-form">{formOpen ? 'Close form' : 'Add transaction'}</button>
    </div>

    {formOpen && <div id="transaction-form" className="composer-panel"><EntryForm key={editing?._id || 'new'} kind="transaction" initial={editing} onSave={save} onCancel={closeForm} /></div>}
    <ErrorState message={mutationError} />

    {loading ? <LoadingState label="Loading transactions" compact /> : error ? <ErrorState message={error} onRetry={() => setRefresh((value) => value + 1)} /> : !items.length ? (
      <EmptyState title="No transactions yet" actionLabel="Add a transaction" onAction={openNew}>Record an expense or income to start building your overview.</EmptyState>
    ) : <>
      <div className="list-caption"><span>Transactions</span><span>{items.length} total</span></div>
      <ul className="transaction-list">{items.slice(0, limit).map((item) => <li key={item._id} className="transaction-row">
        <span className={`transaction-icon ${item.type === 'income' ? 'is-income' : ''}`} aria-hidden="true">{item.type === 'income' ? '↙' : '↗'}</span>
        <div className="transaction-info"><strong>{item.category}</strong><span>{item.description || (item.type === 'income' ? 'Income' : 'Expense')} · {dateLabel(item.date)}</span></div>
        <strong className={`transaction-amount ${item.type === 'income' ? 'is-income' : ''}`}>{item.type === 'income' ? '+' : '−'}{money(item.amount)}</strong>
        <div className="row-actions">
          <button type="button" disabled={Boolean(pending)} onClick={() => openEdit(item)}>Edit</button>
          {confirming === item._id ? <><button type="button" disabled={Boolean(pending)} onClick={() => setConfirming('')}>Cancel</button><button type="button" disabled={Boolean(pending)} className="danger-link" onClick={() => remove(item._id)}>{pending === item._id ? 'Deleting…' : 'Confirm delete'}</button></> : <button type="button" disabled={Boolean(pending)} className="danger-link" onClick={() => setConfirming(item._id)}>Delete</button>}
        </div>
      </li>)}</ul>
      {items.length > limit && <button type="button" className="quiet-button mt-5 w-full" onClick={() => setLimit((value) => value + 8)}>Show more transactions</button>}
    </>}
  </section>
}
