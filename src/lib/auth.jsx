import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const DEV_MODE = !import.meta.env.VITE_API_URL

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
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
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

    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || 'Erro ao fazer login')
    }

    const data = await res.json()
    setUser(data.user)
    return data
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
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
