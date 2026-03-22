import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi, apiFetch } from '../../../hooks/useApi.js'
import { EditIcon, ArchiveIcon, RestoreIcon, ActionBtn } from '../../../components/portal/ActionIcons.jsx'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'prospect', label: 'Prospecto' },
  { value: 'churned', label: 'Churned' },
]

const DOMAIN_OWNERSHIP_OPTIONS = [
  { value: 'forge', label: 'Forge Studio' },
  { value: 'client', label: 'Cliente' },
  { value: 'third_party', label: 'Terceiro' },
]

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export default function AdminClients() {
  const navigate = useNavigate()
  const [showArchived, setShowArchived] = useState(false)
  const { data, loading, refetch } = useApi(`/api/clients${showArchived ? '?archived=true' : ''}`)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const clients = data?.clients || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">Clientes</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-portal-muted text-sm">Gerencie seus clientes</p>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="text-xs text-portal-muted hover:text-copper transition-colors"
            >
              {showArchived ? 'Ocultar arquivados' : 'Ver arquivados'}
            </button>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Novo Cliente
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-portal-border">
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Cliente</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Projetos</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">MRR</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">LGPD</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Acao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-portal-muted text-sm">
                    Nenhum cliente cadastrado. Clique em "Novo Cliente" para comecar.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/portal/admin/clients/${c.id}`)} className="hover:bg-portal-border/10 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <p className="text-portal-text text-sm font-medium">{c.company_name || c.user_name}</p>
                      {c.company_name && <p className="text-portal-muted text-xs">{c.user_name}</p>}
                    </td>
                    <td className="px-6 py-4 text-portal-muted text-sm hidden md:table-cell">{c.email}</td>
                    <td className="px-6 py-4 text-portal-text text-sm">{c.project_count}</td>
                    <td className="px-6 py-4 text-portal-text text-sm font-medium hidden md:table-cell">
                      R$ {Number(c.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {c.lgpd_consent_at ? (
                        <span className="text-success text-xs font-medium">Aceito</span>
                      ) : (
                        <span className="text-warning text-xs font-medium">Pendente</span>
                      )}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <ActionBtn title="Editar" color="text-copper" hoverColor="hover:text-copper-dark" onClick={() => { setEditing(c); setShowModal(true) }}>
                          <EditIcon />
                        </ActionBtn>
                        <ActionBtn
                          title={c.is_active ? 'Arquivar' : 'Restaurar'}
                          color={c.is_active ? 'text-portal-muted' : 'text-success'}
                          hoverColor={c.is_active ? 'hover:text-danger' : 'hover:text-success/80'}
                          onClick={async () => {
                            const action = c.is_active ? 'arquivar' : 'desarquivar'
                            if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} este cliente?`)) return
                            await apiFetch(`/api/clients/${c.id}/archive`, {
                              method: 'PUT',
                              body: JSON.stringify({ archived: c.is_active }),
                            })
                            refetch()
                          }}
                        >
                          {c.is_active ? <ArchiveIcon /> : <RestoreIcon />}
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ClientModal
          client={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={() => { setShowModal(false); setEditing(null); refetch() }}
        />
      )}
    </div>
  )
}

function ClientModal({ client, onClose, onSaved }) {
  const isEdit = !!client
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState('')
  const [form, setForm] = useState({
    name: client?.user_name || '',
    email: client?.email || '',
    company_name: client?.company_name || '',
    phone: client?.phone || '',
    cnpj_cpf: client?.cnpj_cpf || '',
    notes: client?.notes || '',
    // Novos campos CRM
    status: client?.status || 'active',
    segment: client?.segment || '',
    domain_ownership: client?.domain_ownership || '',
    billing_day: client?.billing_day || '',
    acquisition_channel: client?.acquisition_channel || '',
    domain_renewal_date: client?.domain_renewal_date?.split('T')[0] || '',
    // Indicacao e comissao
    referred_by: client?.referred_by || '',
    has_commission: client?.has_commission || false,
    commission_type: client?.commission_type || 'percent',
    commission_value: client?.commission_value || '',
    // Endereco desmembrado
    cep: client?.cep || '',
    street: client?.street || '',
    address_number: client?.address_number || '',
    complement: client?.complement || '',
    city: client?.city || '',
    state: client?.state || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function lookupCep(cep) {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm((f) => ({
          ...f,
          street: data.logradouro || f.street,
          complement: data.complemento || f.complement,
          city: data.localidade || f.city,
          state: data.uf || f.state,
        }))
      }
    } catch {
      // silencioso — usuario preenche manualmente
    } finally {
      setCepLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      // Limpar campos vazios para não sobrescrever com string vazia
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') payload[k] = null
      })
      // billing_day precisa ser numero
      if (payload.billing_day) payload.billing_day = Number(payload.billing_day)

      if (isEdit) {
        await apiFetch(`/api/clients/${client.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        if (!form.name || !form.email) {
          setError('Nome e email sao obrigatorios')
          setSaving(false)
          return
        }
        await apiFetch('/api/clients', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-portal-surface border border-portal-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-portal-text mb-4">{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* === Dados Basicos === */}
          <SectionTitle>Dados Basicos</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome *" value={form.name} onChange={(v) => set('name', v)} required />
            <Field label="Email *" type="email" value={form.email} onChange={(v) => set('email', v)} required />
          </div>
          {!isEdit && (
            <p className="text-portal-muted text-xs">A senha sera gerada automaticamente e enviada por email ao cliente.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Empresa" value={form.company_name} onChange={(v) => set('company_name', v)} />
            <Field label="Telefone" value={form.phone} onChange={(v) => set('phone', v)} />
          </div>
          <Field label="CPF/CNPJ" value={form.cnpj_cpf} onChange={(v) => set('cnpj_cpf', v)} />

          {/* === CRM === */}
          <SectionTitle>Informacoes Comerciais</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Status" value={form.status} onChange={(v) => set('status', v)} options={STATUS_OPTIONS} />
            <ComboField label="Segmento" value={form.segment} onChange={(v) => set('segment', v)} placeholder="Ex: Restaurante, Advocacia..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField label="Titularidade do Dominio" value={form.domain_ownership} onChange={(v) => set('domain_ownership', v)} options={DOMAIN_OWNERSHIP_OPTIONS} allowEmpty />
            <Field label="Dia de Vencimento" type="number" value={form.billing_day} onChange={(v) => set('billing_day', v)} placeholder="1-31" min={1} max={31} />
            <ComboField label="Canal de Origem" value={form.acquisition_channel} onChange={(v) => set('acquisition_channel', v)} placeholder="Ex: Indicacao, Google..." />
          </div>
          <Field label="Data de Renovacao do Dominio" type="date" value={form.domain_renewal_date} onChange={(v) => set('domain_renewal_date', v)} />

          {/* === Indicacao e Comissao === */}
          {form.acquisition_channel?.toLowerCase() === 'indicacao' && (
            <>
              <SectionTitle>Indicacao e Comissao</SectionTitle>
              <Field label="Indicado por" value={form.referred_by} onChange={(v) => set('referred_by', v)} placeholder="Nome de quem indicou" />
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="has_commission"
                  checked={form.has_commission}
                  onChange={(e) => set('has_commission', e.target.checked)}
                  className="rounded border-portal-border"
                />
                <label htmlFor="has_commission" className="text-sm text-portal-text">Tem comissao</label>
              </div>
              {form.has_commission && (
                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    label="Tipo de Comissao"
                    value={form.commission_type}
                    onChange={(v) => set('commission_type', v)}
                    options={[
                      { value: 'percent', label: 'Percentual (%)' },
                      { value: 'fixed', label: 'Valor fixo (R$)' },
                    ]}
                  />
                  <Field
                    label={form.commission_type === 'percent' ? 'Comissao (%)' : 'Comissao (R$)'}
                    type="number"
                    step="0.01"
                    value={form.commission_value}
                    onChange={(v) => set('commission_value', v)}
                    placeholder={form.commission_type === 'percent' ? 'Ex: 10' : 'Ex: 200'}
                  />
                </div>
              )}
              <p className="text-portal-muted text-xs">Comissao aplicada apenas sobre o valor da venda do projeto, nao sobre mensalidades.</p>
            </>
          )}

          {/* === Endereco === */}
          <SectionTitle>Endereco</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Field
                label="CEP"
                value={form.cep}
                onChange={(v) => {
                  set('cep', v)
                  if (v.replace(/\D/g, '').length === 8) lookupCep(v)
                }}
                placeholder="00000-000"
              />
              {cepLoading && (
                <div className="absolute right-3 top-8">
                  <div className="w-4 h-4 border-2 border-copper border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <Field label="Rua" value={form.street} onChange={(v) => set('street', v)} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Numero" value={form.address_number} onChange={(v) => set('address_number', v)} />
            <Field label="Complemento" value={form.complement} onChange={(v) => set('complement', v)} />
            <Field label="Cidade" value={form.city} onChange={(v) => set('city', v)} />
            <SelectField label="Estado" value={form.state} onChange={(v) => set('state', v)} options={STATES.map((s) => ({ value: s, label: s }))} allowEmpty />
          </div>

          {/* === Seguranca (somente edicao) === */}
          {isEdit && (
            <>
              <SectionTitle>Seguranca</SectionTitle>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={resetting}
                  onClick={async () => {
                    if (!confirm('Gerar nova senha e enviar por email para o cliente?')) return
                    setResetting(true)
                    setResetMsg('')
                    try {
                      const res = await apiFetch(`/api/clients/${client.id}/reset-password`, { method: 'POST' })
                      setResetMsg(res.message || 'Senha redefinida com sucesso')
                    } catch (err) {
                      setResetMsg(err.message)
                    } finally {
                      setResetting(false)
                    }
                  }}
                  className="text-danger hover:text-danger/80 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {resetting ? 'Enviando...' : 'Resetar Senha'}
                </button>
                {resetMsg && <span className="text-portal-muted text-xs">{resetMsg}</span>}
              </div>
            </>
          )}

          {/* === Observacoes === */}
          <SectionTitle>Observacoes</SectionTitle>
          <div>
            <textarea
              value={form.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-portal-bg border border-portal-border rounded-lg text-portal-text text-sm focus:outline-none focus:border-copper resize-none"
            />
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-portal-muted text-sm hover:text-portal-text transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-semibold text-portal-muted uppercase tracking-wider border-b border-portal-border pb-1">
      {children}
    </h3>
  )
}

const inputClass = "w-full px-3 py-2 bg-portal-bg border border-portal-border rounded-lg text-portal-text text-sm focus:outline-none focus:border-copper disabled:opacity-50"

function Field({ label, value, onChange, type = 'text', required, disabled, placeholder, min, max, step }) {
  return (
    <div>
      <label className="block text-sm font-medium text-portal-text mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={inputClass}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options, allowEmpty }) {
  return (
    <div>
      <label className="block text-sm font-medium text-portal-text mb-1">{label}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} className={`${inputClass} h-[38px]`}>
        {allowEmpty && <option value="">—</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function ComboField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-portal-text mb-1">{label}</label>
      <input
        type="text"
        list={`list-${label}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      <datalist id={`list-${label}`}>
        {label === 'Segmento' && (
          <>
            <option value="Restaurante" />
            <option value="Advocacia" />
            <option value="Saude" />
            <option value="Educacao" />
            <option value="Ecommerce" />
            <option value="Imobiliaria" />
            <option value="Agencia" />
            <option value="Consultoria" />
            <option value="Industria" />
            <option value="Servicos" />
            <option value="Tecnologia" />
          </>
        )}
        {label === 'Canal de Origem' && (
          <>
            <option value="Indicacao" />
            <option value="Google" />
            <option value="Instagram" />
            <option value="WhatsApp" />
            <option value="LinkedIn" />
            <option value="Evento" />
            <option value="Outro" />
          </>
        )}
      </datalist>
    </div>
  )
}
