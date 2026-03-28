import { useState } from 'react'
import { useAuth } from '../../lib/auth.jsx'
import { apiFetch, useApi } from '../../hooks/useApi.js'

export default function Settings() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-bold text-portal-text mb-1">Configurações</h1>
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

        {/* 2FA — somente admin */}
        {user?.role === 'admin' && <TwoFactorSection />}

        {/* LGPD */}
        <LgpdSection />
      </div>
    </div>
  )
}

function TwoFactorSection() {
  const { user, checkSession } = useAuth()
  const [step, setStep] = useState('idle') // idle, setup, verify, disable
  const [qrData, setQrData] = useState(null)
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  // PassKeys
  const { data: pkData, refetch: refetchPk } = useApi('/api/passkeys')
  const passkeys = pkData?.passkeys || []
  const [pkRegistering, setPkRegistering] = useState(false)
  const [pkName, setPkName] = useState('')

  const totpEnabled = user?.totp_enabled

  async function startTotpSetup() {
    setError('')
    try {
      const res = await apiFetch('/api/auth/totp/setup', { method: 'POST' })
      setQrData(res.qr)
      setSecret(res.secret)
      setStep('verify')
    } catch (err) {
      setError(err.message)
    }
  }

  async function verifyTotp(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiFetch('/api/auth/totp/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      setSuccess('2FA TOTP ativado com sucesso')
      setStep('idle')
      setCode('')
      checkSession()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function disableTotp(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiFetch('/api/auth/totp/disable', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
      setSuccess('2FA TOTP desativado')
      setStep('idle')
      setPassword('')
      checkSession()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function registerPasskey() {
    setPkRegistering(true)
    setError('')
    try {
      const options = await apiFetch('/api/passkeys/register/options', { method: 'POST' })
      options.challenge = base64ToBuffer(options.challenge)
      options.user.id = base64ToBuffer(options.user.id)
      if (options.excludeCredentials) {
        options.excludeCredentials = options.excludeCredentials.map((c) => ({
          ...c,
          id: base64ToBuffer(c.id),
        }))
      }
      const credential = await navigator.credentials.create({ publicKey: options })
      const body = {
        id: credential.id,
        rawId: bufferToBase64(credential.rawId),
        response: {
          attestationObject: bufferToBase64(credential.response.attestationObject),
          clientDataJSON: bufferToBase64(credential.response.clientDataJSON),
        },
        type: credential.type,
        clientExtensionResults: credential.getClientExtensionResults(),
        authenticatorAttachment: credential.authenticatorAttachment,
      }
      if (credential.response.getTransports) {
        body.response.transports = credential.response.getTransports()
      }
      await apiFetch(`/api/passkeys/register/verify?device_name=${encodeURIComponent(pkName || 'Passkey')}`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setSuccess('PassKey registrada com sucesso')
      setPkName('')
      refetchPk()
    } catch (err) {
      if (err.name !== 'NotAllowedError') setError(err.message || 'Falha ao registrar PassKey')
    } finally {
      setPkRegistering(false)
    }
  }

  async function deletePasskey(id) {
    if (!confirm('Remover esta PassKey?')) return
    try {
      await apiFetch(`/api/passkeys/${id}`, { method: 'DELETE' })
      refetchPk()
    } catch (err) {
      setError(err.message)
    }
  }

  const inputClass = "w-full px-3 py-2 bg-portal-bg border border-portal-border rounded-lg text-portal-text text-sm focus:outline-none focus:border-copper"

  return (
    <section className="bg-portal-surface border border-portal-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-portal-text mb-4">Autenticação em Dois Fatores (2FA)</h2>

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

      {/* TOTP */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-portal-text mb-2">Authenticator (TOTP)</h3>
        <p className="text-xs text-portal-muted mb-3">
          Use o Google Authenticator ou similar para gerar códigos de 6 dígitos.
        </p>

        {step === 'idle' && (
          totpEnabled ? (
            <div className="flex items-center gap-3">
              <span className="text-success text-sm font-medium">Ativado</span>
              <button onClick={() => { setStep('disable'); setError(''); setSuccess('') }} className="text-danger text-sm hover:underline">
                Desativar
              </button>
            </div>
          ) : (
            <button onClick={startTotpSetup} className="text-copper hover:text-copper-dark text-sm font-medium transition-colors">
              Configurar TOTP
            </button>
          )
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            {qrData && (
              <div className="flex justify-center">
                <img src={qrData} alt="QR Code TOTP" className="w-48 h-48 rounded-lg" />
              </div>
            )}
            <p className="text-xs text-portal-muted text-center">
              Ou insira manualmente: <code className="text-copper">{secret}</code>
            </p>
            <form onSubmit={verifyTotp} className="space-y-3">
              <div>
                <label className="block text-sm text-portal-muted mb-1">Código do Authenticator</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className={inputClass + ' text-center text-2xl tracking-widest'}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving || code.length < 6} className="bg-copper text-white px-4 py-2 rounded-lg text-sm hover:bg-copper-dark disabled:opacity-50">
                  {saving ? 'Verificando...' : 'Ativar 2FA'}
                </button>
                <button type="button" onClick={() => setStep('idle')} className="text-portal-muted text-sm hover:text-portal-text">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'disable' && (
          <form onSubmit={disableTotp} className="space-y-3">
            <div>
              <label className="block text-sm text-portal-muted mb-1">Confirme sua senha para desativar</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-danger text-white px-4 py-2 rounded-lg text-sm hover:bg-danger/80 disabled:opacity-50">
                {saving ? 'Desativando...' : 'Desativar TOTP'}
              </button>
              <button type="button" onClick={() => setStep('idle')} className="text-portal-muted text-sm hover:text-portal-text">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* PassKeys */}
      <div className="border-t border-portal-border pt-4">
        <h3 className="text-sm font-semibold text-portal-text mb-2">PassKeys (Biometria)</h3>
        <p className="text-xs text-portal-muted mb-3">
          Use Face ID, Touch ID ou chave de segurança para fazer login sem senha.
        </p>

        {passkeys.length > 0 && (
          <div className="space-y-2 mb-4">
            {passkeys.map((pk) => (
              <div key={pk.id} className="flex items-center justify-between bg-portal-bg rounded-lg p-3">
                <div>
                  <span className="text-portal-text text-sm">{pk.device_name}</span>
                  <span className="text-portal-muted text-xs ml-2">
                    {new Date(pk.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <button onClick={() => deletePasskey(pk.id)} className="text-danger text-xs hover:underline">
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={pkName}
            onChange={(e) => setPkName(e.target.value)}
            placeholder="Nome do dispositivo"
            className={inputClass + ' max-w-xs'}
          />
          <button
            onClick={registerPasskey}
            disabled={pkRegistering}
            className="text-copper hover:text-copper-dark text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {pkRegistering ? 'Registrando...' : '+ Adicionar PassKey'}
          </button>
        </div>
      </div>
    </section>
  )
}

// WebAuthn helpers
function base64ToBuffer(base64) {
  const str = base64.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(str)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function LgpdSection() {
  const [showData, setShowData] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleViewData() {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/lgpd/my-data')
      setData(res)
      setShowData(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleExportData() {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/lgpd/my-data')
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meus-dados-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className="bg-portal-surface border border-portal-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-portal-text mb-4">Privacidade (LGPD)</h2>
        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 mb-4">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}
        <div className="space-y-2">
          <button
            onClick={handleViewData}
            disabled={loading}
            className="text-copper hover:text-copper-dark text-sm font-medium transition-colors block disabled:opacity-50"
          >
            {loading ? 'Carregando...' : 'Ver meus dados'}
          </button>
          <button
            onClick={handleExportData}
            disabled={loading}
            className="text-copper hover:text-copper-dark text-sm font-medium transition-colors block disabled:opacity-50"
          >
            Exportar meus dados
          </button>
          <button className="text-danger hover:text-danger/80 text-sm font-medium transition-colors block">
            Solicitar exclusão da conta
          </button>
        </div>
      </section>

      {showData && data && (
        <MyDataModal data={data} onClose={() => setShowData(false)} />
      )}
    </>
  )
}

const STATUS_PT = { pending: 'Pendente', paid: 'Pago', overdue: 'Atrasado', cancelled: 'Cancelado' }
const PROJECT_STATUS_PT = { briefing: 'Briefing', design: 'Design', development: 'Desenvolvimento', review: 'Revisão', published: 'Publicado', maintenance: 'Manutenção', archived: 'Arquivado' }
const PROJECT_TYPE_PT = { landing_page: 'Landing Page', site: 'Site Institucional', system: 'Sistema' }
const PLAN_TYPE_PT = { hosting: 'Hospedagem', maintenance: 'Manutenção', combo: 'Combo' }
const AUDIT_ACTION_PT = { consent_granted: 'Consentimento aceito', data_access: 'Visualização de dados', data_export: 'Exportação de dados', impersonation_start: 'Início de impersonação', impersonation_stop: 'Fim de impersonação' }

function MyDataModal({ data, onClose }) {
  const { personal, consent, projects, payments, plans, audit_log } = data

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-portal-surface border border-portal-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-portal-border">
          <h2 className="text-lg font-bold text-portal-text">Meus Dados Pessoais</h2>
          <button onClick={onClose} className="text-portal-muted hover:text-portal-text transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Dados pessoais */}
          <div>
            <h3 className="text-xs font-semibold text-portal-muted uppercase tracking-wider mb-3">Dados Pessoais</h3>
            <div className="bg-portal-bg rounded-lg p-4 space-y-2">
              <DataRow label="Nome" value={personal.name} />
              <DataRow label="Email" value={personal.email} />
              {personal.phone && <DataRow label="Telefone" value={personal.phone} />}
              {personal.company_name && <DataRow label="Empresa" value={personal.company_name} />}
              {personal.cnpj_cpf && <DataRow label="CPF/CNPJ" value={personal.cnpj_cpf} />}
              {personal.segment && <DataRow label="Segmento" value={personal.segment} />}
              {personal.address && <DataRow label="Endereço" value={personal.address} />}
              <DataRow label="Conta criada em" value={new Date(personal.account_created).toLocaleDateString('pt-BR')} />
            </div>
          </div>

          {/* Consentimento */}
          <div>
            <h3 className="text-xs font-semibold text-portal-muted uppercase tracking-wider mb-3">Consentimento LGPD</h3>
            <div className="bg-portal-bg rounded-lg p-4 space-y-2">
              <DataRow label="Situação" value={consent.accepted_at ? 'Aceito' : 'Pendente'} />
              {consent.accepted_at && <DataRow label="Aceito em" value={new Date(consent.accepted_at).toLocaleString('pt-BR')} />}
              {consent.version && <DataRow label="Versão" value={consent.version} />}
            </div>
          </div>

          {/* Projetos */}
          {projects.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-portal-muted uppercase tracking-wider mb-3">Projetos ({projects.length})</h3>
              <div className="space-y-2">
                {projects.map((p, i) => (
                  <div key={i} className="bg-portal-bg rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-portal-text text-sm font-medium">{p.name}</p>
                      <p className="text-portal-muted text-xs">{PROJECT_TYPE_PT[p.type] || p.type} — {p.domain || '—'}</p>
                    </div>
                    <span className="text-xs text-portal-muted">{PROJECT_STATUS_PT[p.status] || p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Planos */}
          {plans.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-portal-muted uppercase tracking-wider mb-3">Planos ({plans.length})</h3>
              <div className="space-y-2">
                {plans.map((pl, i) => (
                  <div key={i} className="bg-portal-bg rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-portal-text text-sm font-medium">{PLAN_TYPE_PT[pl.type] || pl.type}</p>
                      <p className="text-portal-muted text-xs capitalize">{pl.tier || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-portal-text text-sm font-medium">R$ {Number(pl.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-portal-muted text-xs">{pl.is_active ? 'Ativo' : 'Inativo'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagamentos */}
          {payments.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-portal-muted uppercase tracking-wider mb-3">Pagamentos (últimos 24)</h3>
              <div className="bg-portal-bg rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-portal-border">
                      <th className="text-left px-4 py-2 text-xs text-portal-muted font-medium">Referência</th>
                      <th className="text-left px-4 py-2 text-xs text-portal-muted font-medium">Valor</th>
                      <th className="text-left px-4 py-2 text-xs text-portal-muted font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-portal-border">
                    {payments.map((pay, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-portal-text">{pay.reference_month || '—'}</td>
                        <td className="px-4 py-2 text-portal-text">R$ {Number(pay.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-2 text-portal-muted">{STATUS_PT[pay.status] || pay.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audit log */}
          {audit_log.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-portal-muted uppercase tracking-wider mb-3">Registro de Acessos</h3>
              <div className="bg-portal-bg rounded-lg p-4 space-y-1 max-h-40 overflow-y-auto">
                {audit_log.map((log, i) => (
                  <p key={i} className="text-portal-muted text-xs">
                    {new Date(log.created_at).toLocaleString('pt-BR')} — {AUDIT_ACTION_PT[log.action] || log.action} — IP: {log.ip_address}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-portal-border text-center">
          <p className="text-portal-muted text-xs">
            Dados coletados conforme a Lei Geral de Proteção de Dados (LGPD). Para dúvidas, entre em contato pelo WhatsApp.
          </p>
        </div>
      </div>
    </div>
  )
}

function DataRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-portal-muted text-xs shrink-0">{label}</span>
      <span className="text-portal-text text-sm text-right">{value || '—'}</span>
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
      setError('As senhas não coincidem')
      return
    }
    if (newPw.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres')
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
    if (!confirm('Uma nova senha será gerada e enviada para seu email. Deseja continuar?')) return
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
      <h2 className="text-lg font-semibold text-portal-text mb-4">Segurança</h2>

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
