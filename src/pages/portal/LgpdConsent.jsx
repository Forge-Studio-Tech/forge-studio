import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth.jsx'
import { apiFetch } from '../../hooks/useApi.js'

export default function LgpdConsent() {
  const { user, checkSession } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    privacy_policy: false,
    data_processing: false,
    marketing: false,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.privacy_policy || !form.data_processing) {
      setError('Voce precisa aceitar os consentimentos obrigatorios para continuar.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await apiFetch('/api/auth/lgpd-consent', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      await checkSession()
      navigate('/portal', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-portal-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <img src="/ForgeLogo.png" alt="Forge Studio" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-portal-text">Bem-vindo, {user?.name?.split(' ')[0]}</h1>
          <p className="text-portal-muted text-sm mt-2">
            Antes de continuar, precisamos do seu consentimento conforme a Lei Geral de Protecao de Dados (LGPD).
          </p>
        </div>

        <div className="bg-portal-surface border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-portal-text mb-4">Termos de Uso e Privacidade</h2>

          <div className="space-y-4 mb-6">
            <Section title="Dados coletados">
              <ul className="list-disc list-inside space-y-1">
                <li>Nome, email e telefone para identificacao e contato</li>
                <li>Dados da empresa (razao social, CNPJ/CPF, endereco) para prestacao de servicos</li>
                <li>Informacoes de projetos e servicos contratados</li>
                <li>Dados de pagamento e historico financeiro</li>
                <li>IP e dados de sessao para seguranca da plataforma</li>
              </ul>
            </Section>

            <Section title="Finalidade do tratamento">
              <ul className="list-disc list-inside space-y-1">
                <li>Prestacao dos servicos contratados (sites, landing pages, sistemas)</li>
                <li>Gestao de projetos e acompanhamento de status</li>
                <li>Emissao de cobrancas e controle financeiro</li>
                <li>Comunicacao sobre andamento de projetos e servicos</li>
                <li>Seguranca e auditoria de acesso a plataforma</li>
              </ul>
            </Section>

            <Section title="Seus direitos">
              <p>Voce pode a qualquer momento solicitar acesso, correcao, exportacao ou exclusao dos seus dados pessoais atraves das configuracoes da sua conta ou entrando em contato conosco.</p>
            </Section>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Checkbox
              id="privacy_policy"
              checked={form.privacy_policy}
              onChange={(v) => setForm({ ...form, privacy_policy: v })}
              required
              label="Li e aceito a Politica de Privacidade"
              tag="Obrigatorio"
            />

            <Checkbox
              id="data_processing"
              checked={form.data_processing}
              onChange={(v) => setForm({ ...form, data_processing: v })}
              required
              label="Autorizo o tratamento dos meus dados para execucao dos servicos contratados"
              tag="Obrigatorio"
            />

            <Checkbox
              id="marketing"
              checked={form.marketing}
              onChange={(v) => setForm({ ...form, marketing: v })}
              label="Autorizo o envio de comunicacoes sobre novidades e servicos via WhatsApp ou email"
              tag="Opcional"
            />

            {error && <p className="text-danger text-sm">{error}</p>}

            <button
              type="submit"
              disabled={saving || !form.privacy_policy || !form.data_processing}
              className="w-full bg-copper hover:bg-copper-dark text-stone-950 font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Aceitar e Continuar'}
            </button>
          </form>

          <p className="text-portal-muted text-xs text-center mt-4">
            Ao continuar, um registro do seu consentimento sera salvo com data, hora e IP para fins de auditoria.
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-portal-bg rounded-lg p-4">
      <h3 className="text-sm font-semibold text-portal-text mb-2">{title}</h3>
      <div className="text-portal-muted text-xs leading-relaxed">{children}</div>
    </div>
  )
}

function Checkbox({ id, checked, onChange, label, tag, required }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded border-portal-border text-copper focus:ring-copper shrink-0"
      />
      <span className="text-sm text-portal-text leading-snug">
        {label}
        {tag && (
          <span className={`ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${required ? 'bg-copper/15 text-copper' : 'bg-portal-border/50 text-portal-muted'}`}>
            {tag}
          </span>
        )}
      </span>
    </label>
  )
}
