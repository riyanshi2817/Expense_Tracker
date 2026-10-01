import axios from 'axios'

export const TOKEN_STORAGE_KEY = 'clearcash_token'

const client = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, ''),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

client.interceptors.response.use((response) => response, (error) => {
  if (axios.isCancel(error)) return Promise.reject(error)
  const status = error.response?.status
  const url = error.config?.url
  if (import.meta.env.DEV) {
    console.error('[API request failed]', { status: status ?? null, url, response: error.response?.data ?? null })
  }
  const currentToken = localStorage.getItem(TOKEN_STORAGE_KEY)
  const requestAuthorization = error.config?.headers?.Authorization
  // A late failure from a previous session must not invalidate a new login.
  if (status === 401 && !url?.startsWith('/api/auth/') && currentToken &&
      requestAuthorization === `Bearer ${currentToken}`) {
    sessionStorage.setItem('clearcash_session_message', 'Your session expired. Please sign in again.')
    window.dispatchEvent(new Event('clearcash:session-expired'))
  }
  return Promise.reject(error)
})

export default client
