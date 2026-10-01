import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ open, onClose, title, message, children, icon, primaryLabel = 'Got it', secondaryLabel = 'Not now' }) {
  const ref = useRef(null)
  const titleId = useId()
  const messageId = useId()
  useEffect(() => {
    if (!open) return
    const dialog = ref.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [open])
  const trapFocus = (event) => {
    if (event.key !== 'Tab') return
    const controls = Array.from(event.currentTarget.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')).filter((element) => element.getClientRects().length)
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (!first) { event.preventDefault(); return }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
      event.preventDefault(); last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus()
    }
  }
  if (!open) return null
  return createPortal(<dialog ref={ref} onKeyDown={trapFocus} aria-labelledby={titleId} aria-describedby={message ? messageId : undefined} onCancel={(event) => { event.preventDefault(); onClose() }} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-card border border-border bg-surface-elevated p-6 text-ink shadow-card backdrop:bg-black/70 sm:p-8">
    <div aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-2xl text-accent-soft">{icon || '!'}</div>
    <h2 id={titleId} className="mt-4 text-center font-display text-2xl font-bold">{title}</h2>
    {message && <div id={messageId} className="mt-3 text-center text-sm leading-6 text-ink-secondary">{message}</div>}
    {children}
    <div className="mt-6 grid grid-cols-2 gap-3">
      <button type="button" className="action-button" onClick={onClose}>{primaryLabel}</button>
      <button type="button" className="rounded-xl border border-border px-4 py-3 text-sm font-semibold" onClick={onClose}>{secondaryLabel}</button>
    </div>
    <button type="button" className="mx-auto mt-4 block px-4 py-2 text-sm text-ink-secondary underline underline-offset-4" onClick={onClose}>Dismiss</button>
  </dialog>, document.body)
}
