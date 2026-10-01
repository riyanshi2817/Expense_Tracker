export const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
export const validAmount = (value, minimum = 0.01) => String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= minimum
export const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
export function apiError(error, fallback = 'Something went wrong. Please try again.') {
  if (Array.isArray(error.response?.data?.errors)) return error.response.data.errors.join('. ')
  if (error.response?.status === 401) return 'Your session expired. Please sign in again.'
  if (error.code === 'ECONNABORTED') return 'The request took too long. Please try again.'
  return error.response?.data?.message || fallback
}
export function validateEntry(kind, values) {
  const errors = {}
  if (!validAmount(values.amount)) errors.amount = 'Enter an amount greater than zero.'
  const dateKey = kind === 'transaction' ? 'date' : 'nextDueDate'
  if (!validDate(values[dateKey])) errors[dateKey] = 'Choose a valid date.'
  if (kind === 'transaction') {
    if (!values.category.trim()) errors.category = 'Enter a category.'
    if (!['income', 'expense'].includes(values.type)) errors.type = 'Choose income or expense.'
  } else {
    if (!values.name.trim()) errors.name = 'Enter a subscription name.'
    if (!['monthly', 'yearly'].includes(values.billingCycle)) errors.billingCycle = 'Choose a billing cycle.'
    if (!['active', 'unused'].includes(values.status)) errors.status = 'Choose a status.'
  }
  return errors
}
