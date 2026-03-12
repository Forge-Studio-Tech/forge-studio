import { useState } from 'react'
import { useAuth } from '../../lib/auth.jsx'
import { apiFetch } from '../../hooks/useApi.js'

export default function Settings() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-bold text-portal-text mb-1">Configuracoes</h1>
      <p className="text-portal-muted text-sm mb-8">Gerencie sua conta</p>

      <div className="space-y-6 max-w-xl">
        {/* Dados pessoais */}
        <section className="bg-portal-surface border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-portal-text mb-4">Dados Pessoais</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-portal-muted mb-1">Nome</label>
              <p className="text-portal-text text-sm">{user?.name || '—'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-portal-muted mb-1">Email</label>
              <p className="text-portal-text text-sm">{user?.email || '—'}</p>
            </div>
          </div>
        </section>

        {/* Seguranca */}
        <SecuritySection />

        {/* LGPD */}
        <section className="bg-portal-surface border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-portal-text mb-4">Privacidade (LGPD)</h2>
          <div className="space-y-2">
            <button className="text-copper hover:text-copper-dark text-sm font-medium transition-colors block">
              Ver meus dados
            </button>
            <button className="text-copper hover:text-copper-dark text-sm font-medium transition-colors block">
              Exportar meus dados
            </button>
            <button className="text-danger hover:text-danger/80 text-sm font-medium transition-colors block">
              Solicitar exclusao da conta
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function SecuritySection() {
  const [showChangeForm, setShowChangeForm] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPw !== confirmPw) {
      setError('As senhas nao coincidem')
      return
    }
    if (newPw.length < 8) {
      setError('A nova senha deve ter no minimo 8 caracteres')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      })
      setSuccess('Senha alterada com sucesso')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setShowChangeForm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleResetPassword() {
    if (!confirm('Uma nova senha sera gerada e enviada para seu email. Deseja continuar?')) return
    setResetting(true)
    setError('')
    setSuccess('')
    try {
      const res = await apiFetch('/api/auth/reset-password', { method: 'POST' })
      setSuccess(res.message || 'Nova senha enviada para seu email')
    } catch (err) {
      setError(err.message)
    } finally {
      setResetting(false)
    }
  }

  const inputClass = "w-full px-3 py-2 bg-portal-bg border border-portal-border rounded-lg text-portal-text text-sm focus:outline-none focus:border-copper"

  return (
    <section className="bg-portal-surface border border-portal-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-portal-text mb-4">Seguranca</h2>

      {success && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-3 mb-4">
          <p className="text-success text-sm">{success}</p>
        </div>
      )}
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 mb-4">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {showChangeForm ? (
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Senha atual</label>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Nova senha</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Confirmar nova senha</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required className={inputClass} />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving} className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : 'Alterar Senha'}
            </button>
            <button type="button" onClick={() => { setShowChangeForm(false); setError('') }} className="text-portal-muted text-sm hover:text-portal-text transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          <button
            onClick={() => { setShowChangeForm(true); setSuccess(''); setError('') }}
            className="text-copper hover:text-copper-dark text-sm font-medium transition-colors block"
          >
            Trocar senha
          </button>
          <button
            onClick={handleResetPassword}
            disabled={resetting}
            className="text-portal-muted hover:text-portal-text text-sm transition-colors block disabled:opacity-50"
          >
            {resetting ? 'Enviando...' : 'Resetar senha (receber nova por email)'}
          </button>
        </div>
      )}
    </section>
  )
}
