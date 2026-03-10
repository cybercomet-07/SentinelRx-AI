import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import i18n from '../i18n'

const AuthContext = createContext(null)

function syncLanguage(lang) {
  const code = ['en', 'hi', 'mr'].includes(lang) ? lang : 'en'
  i18n.changeLanguage(code)
  localStorage.setItem('sentinelrx_lang', code)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('sentinelrx_token')
    const stored = localStorage.getItem('sentinelrx_user')
    if (!token) {
      if (stored) {
        localStorage.removeItem('sentinelrx_user')
      }
      setLoading(false)
      return
    }
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {}
    }
    authService.me()
      .then((r) => {
        const fresh = { ...r.data, role: r.data.role?.toLowerCase() || 'user' }
        setUser(fresh)
        localStorage.setItem('sentinelrx_user', JSON.stringify(fresh))
        syncLanguage(fresh.preferred_language)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('sentinelrx_user', JSON.stringify(userData))
    localStorage.setItem('sentinelrx_token', token)
    setUser(userData)
    syncLanguage(userData.preferred_language)
  }

  const updateUser = (userData) => {
    localStorage.setItem('sentinelrx_user', JSON.stringify(userData))
    setUser(userData)
    if (userData.preferred_language != null) {
      syncLanguage(userData.preferred_language)
    }
  }

  const logout = () => {
    localStorage.removeItem('sentinelrx_user')
    localStorage.removeItem('sentinelrx_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => useContext(AuthContext)
