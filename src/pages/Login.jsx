import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/portal', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-forge-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-10">
          <img src="/ForgeLogo.png" alt="Forge Studio" className="h-12 w-auto" />
          <span className="text-forge-text font-black text-2xl tracking-tight">
            Forge Studio
          </span>
        </Link>

        {/* Card */}
        <div className="bg-forge-surface border border-forge-border rounded-xl p-8">
          <h1 className="text-forge-text text-xl font-bold mb-1">Entrar</h1>
          <p className="text-forge-muted text-sm mb-6">
            Acesse o portal da Forge Studio
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-forge-text mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 bg-forge-bg border border-forge-border rounded-lg text-forge-text text-sm placeholder:text-forge-muted focus:outline-none focus:border-copper focus:ring-1 focus:ring-copper transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-forge-text mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 bg-forge-bg border border-forge-border rounded-lg text-forge-text text-sm placeholder:text-forge-muted focus:outline-none focus:border-copper focus:ring-1 focus:ring-copper transition-colors"
                placeholder="Sua senha"
              />
            </div>

            {error && (
              <p className="text-danger text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-copper hover:bg-copper-dark text-stone-950 font-bold py-2.5 rounded-lg text-sm tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-forge-muted text-xs text-center mt-6">
            Utilizamos cookies de sessão para manter você conectado.
          </p>
        </div>

        {/* Voltar ao site */}
        <Link
          to="/"
          className="block text-center text-forge-muted hover:text-copper text-sm mt-6 transition-colors"
        >
          &larr; Voltar ao site
        </Link>
      </div>
    </div>
  )
}
