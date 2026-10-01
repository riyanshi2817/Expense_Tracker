import { QueryClient } from '@tanstack/react-query'
import client from './client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failures, error) => failures < 1 && (!error.response || error.response.status >= 500),
    },
  },
})

export const queryKeys = {
  summary: ['dashboard', 'summary'],
  analytics: ['dashboard', 'analytics'],
  transactions: ['transactions'],
  subscriptions: ['subscriptions'],
  subscriptionList: (filter) => ['subscriptions', 'list', filter],
  subscriptionWaste: ['subscriptions', 'waste'],
  dueSoon: ['subscriptions', 'due-soon'],
  goals: ['goals'],
  profile: ['profile'],
}

const get = async (url, { signal, params } = {}) => (await client.get(url, { signal, params })).data

export const queryFns = {
  summary: ({ signal }) => get('/api/dashboard/summary', { signal }),
  analytics: ({ signal }) => get('/api/dashboard/analytics', { signal }),
  transactions: ({ signal }) => get('/api/transactions', { signal }),
  subscriptions: (filter) => ({ signal }) => get('/api/subscriptions', { signal, params: filter === 'all' ? undefined : { status: filter } }),
  subscriptionWaste: ({ signal }) => get('/api/subscriptions/waste', { signal }),
  dueSoon: ({ signal }) => get('/api/subscriptions/due-soon', { signal }),
  goals: ({ signal }) => get('/api/goals', { signal }),
  profile: ({ signal }) => get('/api/users/me', { signal }),
}

export function invalidateFinancialData(clientInstance) {
  return Promise.all([
    clientInstance.invalidateQueries({ queryKey: queryKeys.summary }),
    clientInstance.invalidateQueries({ queryKey: queryKeys.analytics }),
  ])
}
