import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import { invalidateFinancialData, queryFns, queryKeys } from '../api/queries'
import { apiError } from '../utils/validation'
import EntryForm from './EntryForm'
import { TransactionsSkeleton, ErrorState, EmptyState, FetchingSurface } from './Feedback'

const money = (value) => Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const dateLabel = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Transactions({ formOpen, onFormOpenChange }) {
  const queryClient = useQueryClient()
  const transactionsQuery = useQuery({ queryKey: queryKeys.transactions, queryFn: queryFns.transactions })
  const items = transactionsQuery.data?.transactions || []
  const saveMutation = useMutation({
    mutationFn: ({ id, values }) => id ? client.put(`/api/transactions/${id}`, values) : client.post('/api/transactions', values),
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: queryKeys.transactions }), invalidateFinancialData(queryClient)])
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/api/transactions/${id}`),
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: queryKeys.transactions }), invalidateFinancialData(queryClient)])
    },
  })
  const [mutationError, setMutationError] = useState('')
  const [editing, setEditing] = useState(null)
  const [confirming, setConfirming] = useState('')
  const [limit, setLimit] = useState(8)
  const pending = deleteMutation.isPending ? deleteMutation.variables : ''

  const openNew = () => {
    setEditing(null)
    onFormOpenChange(true)
  }

  const closeForm = () => {
    setEditing(null)
    onFormOpenChange(false)
  }

  const save = async (values) => {
    await saveMutation.mutateAsync({ id: editing?._id, values })
    closeForm()
  }

  const remove = async (id) => {
    if (pending) return
    setMutationError('')
    try {
      await deleteMutation.mutateAsync(id)
      setConfirming('')
      if (editing?._id === id) closeForm()
    } catch (requestError) {
      setMutationError(apiError(requestError, 'Unable to delete transaction.'))
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
    {transactionsQuery.isError && transactionsQuery.data && <ErrorState message={apiError(transactionsQuery.error, 'Unable to refresh transactions.')} onRetry={() => transactionsQuery.refetch()} />}

    <FetchingSurface active={transactionsQuery.isFetching && !transactionsQuery.isPending} label="Refreshing transactions">
    {transactionsQuery.isPending ? <TransactionsSkeleton /> : transactionsQuery.isError && !transactionsQuery.data ? <ErrorState message={apiError(transactionsQuery.error, 'Unable to load transactions.')} onRetry={() => transactionsQuery.refetch()} /> : !items.length ? (
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
    </FetchingSurface>
  </section>
}
