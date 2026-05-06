import {
  createContext, useContext, useState, useEffect,
  useCallback, ReactNode,
} from 'react'
import { authApi } from '../services/api'
import type { User, RegisterRequest, TokenResponse } from '../types'

interface AuthContextValue {
  user:     User | null
  loading:  boolean
  login:    (email: string, password: string) => Promise<User>
  register: (body: RegisterRequest) => Promise<User>
  logout:   () => void
  loadUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    try {
      const res  = await authApi.me()
      const u    = res.data.data ?? (res.data as unknown as User)
      setUser(u)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email: string, password: string): Promise<User> => {
    const res     = await authApi.login({ email, password })
    const payload = res.data.data ?? (res.data as unknown as TokenResponse)
    localStorage.setItem('access_token',  payload.access_token)
    localStorage.setItem('refresh_token', payload.refresh_token)
    // load user so role is available immediately
    await loadUser()
    // return current user from state (set by loadUser)
    const meRes = await authApi.me()
    const u = meRes.data.data ?? (meRes.data as unknown as User)
    setUser(u)
    return u
  }

  const register = async (body: RegisterRequest): Promise<User> => {
    const res = await authApi.register(body)
    return res.data.data ?? (res.data as unknown as User)
  }

  const logout = (): void => {
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}