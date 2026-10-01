import Modal from './Modal'
export default function DebitConfirmation({ debit, open, onClose }) {
  if (!debit) return null
  return <Modal open={open} onClose={onClose} title="Upcoming debit" message="Review this upcoming subscription charge.">
    <dl className="mt-5 space-y-3 rounded-2xl bg-surface-muted p-4 text-sm">
      <div><dt className="text-ink-muted">Subscription</dt><dd className="mt-1 break-words font-semibold">{debit.name}</dd></div>
      <div><dt className="text-ink-muted">Amount</dt><dd className="mt-1 text-xl font-bold">{Number(debit.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</dd></div>
      <div><dt className="text-ink-muted">Due date</dt><dd className="mt-1 font-semibold">{new Date(debit.nextDueDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</dd></div>
    </dl>
    <p className="mt-4 text-xs leading-5 text-ink-muted">This is a reminder only. Closing it does not authorize, cancel, or reschedule a payment.</p>
  </Modal>
}
