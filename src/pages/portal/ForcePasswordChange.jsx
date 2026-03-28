import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth.jsx'
import { apiFetch } from '../../hooks/useApi.js'

export default function ForcePasswordChange() {
  const { user, checkSession } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.new_password.length < 8) {
      return setError('A nova senha deve ter no mínimo 8 caracteres')
    }
    if (form.new_password === form.current_password) {
      return setError('A nova senha deve ser diferente da senha temporária')
    }
    if (form.new_password !== form.confirm_password) {
      return setError('As senhas não conferem')
    }

    setSaving(true)
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: form.current_password,
          new_password: form.new_password,
        }),
      })
      // Recarrega sessao pra pegar must_change_password = false
      await checkSession()
      navigate('/portal', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full px-3 py-2.5 bg-forge-bg border border-forge-border rounded-lg text-forge-text text-sm placeholder:text-forge-muted focus:outline-none focus:border-copper focus:ring-1 focus:ring-copper transition-colors'

  return (
    <div className="min-h-screen bg-forge-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-10">
          <img src="/ForgeLogo.png" alt="Forge Studio" className="h-12 w-auto" />
          <span className="text-forge-text font-black text-2xl tracking-tight">Forge Studio</span>
        </div>

        <div className="bg-forge-surface border border-forge-border rounded-xl p-8">
          <h1 className="text-forge-text text-xl font-bold mb-1">Alterar Senha</h1>
          <p className="text-forge-muted text-sm mb-6">
            Você está usando uma senha temporária. Por segurança, escolha uma nova senha para continuar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-forge-text mb-1.5">Senha temporária</label>
              <input
                type="password"
                value={form.current_password}
                onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                required
                className={inputClass}
                placeholder="Senha recebida por email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-forge-text mb-1.5">Nova senha</label>
              <input
                type="password"
                value={form.new_password}
                onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                required
                minLength={8}
                className={inputClass}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-forge-text mb-1.5">Confirmar nova senha</label>
              <input
                type="password"
                value={form.confirm_password}
                onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                required
                className={inputClass}
                placeholder="Repita a nova senha"
              />
            </div>

            {error && <p className="text-danger text-sm">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-copper hover:bg-copper-dark text-stone-950 font-bold py-2.5 rounded-lg text-sm tracking-wide transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Definir Nova Senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
