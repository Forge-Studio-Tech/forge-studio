import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const API_URL = import.meta.env.VITE_API_URL || (IS_LOCAL ? 'http://localhost:3000' : 'https://api.forgestudio.tech')
const DEV_MODE = IS_LOCAL && !import.meta.env.VITE_API_URL

// Usuarios de desenvolvimento — removido quando o backend estiver pronto
const DEV_USERS = [
  {
    id: '1',
    email: 'contato@forgestudio.tech',
    password: 'forge2026',
    name: 'Gabriel Cocenza',
    role: 'admin',
    totp_enabled: true,
    totp_code: '000000',
  },
  {
    id: '2',
    email: 'cliente@teste.com',
    password: 'teste123',
    name: 'Cliente Teste',
    role: 'client',
    totp_enabled: false,
  },
]

const SESSION_KEY = 'forge_dev_session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [impersonating, setImpersonating] = useState(false)
  const [adminName, setAdminName] = useState(null)

  // Verifica sessao ao carregar
  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    if (DEV_MODE) {
      const saved = localStorage.getItem(SESSION_KEY)
      if (saved) {
        try {
          setUser(JSON.parse(saved))
        } catch {
          localStorage.removeItem(SESSION_KEY)
        }
      }
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setImpersonating(!!data.impersonating)
        setAdminName(data.admin_name || null)
      } else {
        setUser(null)
        setImpersonating(false)
        setAdminName(null)
      }
    } catch {
      setUser(null)
      setImpersonating(false)
      setAdminName(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(email, password) {
    if (DEV_MODE) {
      const found = DEV_USERS.find(
        (u) => u.email === email && u.password === password
      )
      if (!found) throw new Error('Email ou senha incorretos')
      const { password: _, ...userData } = found
      setUser(userData)
      localStorage.setItem(SESSION_KEY, JSON.stringify(userData))
      return { user: userData }
    }

    let res
    try {
      res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
    } catch {
      throw new Error('Erro de conexao com o servidor. Verifique sua internet e tente novamente.')
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.message || 'Erro ao fazer login')
    }

    const data = await res.json()
    setUser(data.user)
    return data
  }

  async function startImpersonation(userId) {
    if (DEV_MODE) return

    const res = await fetch(`${API_URL}/api/admin/impersonate/${userId}`, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'include',
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || 'Erro ao impersonar')
    }

    // Recarregar sessao para pegar o user impersonado
    await checkSession()
  }

  async function stopImpersonation() {
    if (DEV_MODE) return

    const res = await fetch(`${API_URL}/api/admin/stop-impersonate`, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'include',
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.message || 'Erro ao parar impersonacao')
    }

    // Recarregar sessao para voltar ao admin
    await checkSession()
  }

  async function logout() {
    if (DEV_MODE) {
      setUser(null)
      localStorage.removeItem(SESSION_KEY)
      return
    }

    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
      })
    } finally {
      setUser(null)
      setImpersonating(false)
      setAdminName(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkSession, impersonating, adminName, startImpersonation, stopImpersonation }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
