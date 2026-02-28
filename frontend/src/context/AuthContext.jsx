import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('sentinelrx_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('sentinelrx_user', JSON.stringify(userData))
    localStorage.setItem('sentinelrx_token', token)
    setUser(userData)
  }

  const updateUser = (userData) => {
    localStorage.setItem('sentinelrx_user', JSON.stringify(userData))
    setUser(userData)
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
