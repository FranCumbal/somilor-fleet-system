import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('somilor_token')
    if (token) {
      authAPI.me()
        .then((r) => setUser(r.data))
        .catch(() => localStorage.removeItem('somilor_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login(email, password)
    localStorage.setItem('somilor_token', res.data.access_token)
    const me = await authAPI.me()
    setUser(me.data)
    return me.data
  }

  const logout = () => {
    localStorage.removeItem('somilor_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
