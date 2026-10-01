import { useCallback, useEffect, useMemo, useState } from 'react'
import client, { TOKEN_STORAGE_KEY } from '../api/client'
import { AuthContext } from './authContext'

const USER_STORAGE_KEY = 'clearcash_user'
const getStoredUser = () => {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY)

  if (!storedUser) return null

  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  )
  const [user, setUser] = useState(getStoredUser)

  const storeSession = (session) => {
    sessionStorage.removeItem('clearcash_session_message')
    localStorage.setItem(TOKEN_STORAGE_KEY, session.token)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user))
    setToken(session.token)
    setUser(session.user)
    return session
  }

  const login = async ({ email, password }) => {
    const { data } = await client.post('/api/auth/login', { email, password })
    return storeSession(data)
  }

  const signup = async ({ name, email, password }) => {
    const { data } = await client.post('/api/auth/signup', {
      name,
      email,
      password,
    })
    return storeSession(data)
  }

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser))
    setUser(updatedUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    window.addEventListener('clearcash:session-expired', logout)
    return () => window.removeEventListener('clearcash:session-expired', logout)
  }, [logout])

  const value = useMemo(
    () => ({ token, user, login, signup, logout, updateUser, isAuthenticated: Boolean(token) }),
    [token, user, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

