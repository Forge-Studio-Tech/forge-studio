import { useState } from 'react'
import { useApi, apiFetch } from '../../../hooks/useApi.js'
import { EditIcon, DeactivateIcon, ActionBtn } from '../../../components/portal/ActionIcons.jsx'

const TYPE_OPTIONS = [
  { value: 'hosting', label: 'Hosting' },
  { value: 'maintenance', label: 'Manutencao' },
  { value: 'full', label: 'Completo' },
]

const TIER_OPTIONS = [
  { value: '', label: 'Nenhum' },
  { value: 'basic', label: 'Basico' },
  { value: 'standard', label: 'Padrao' },
  { value: 'premium', label: 'Premium' },
]

const TYPE_FILTERS = [
  { value: 'all', label: 'Todos' },
  ...TYPE_OPTIONS,
]

export default function PlanTemplates() {
  const { data, loading, refetch } = useApi('/api/plan-templates')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')

  const templates = data?.templates || []
  const filtered = typeFilter === 'all' ? templates : templates.filter((t) => t.type === typeFilter)
  const active = filtered.filter((t) => t.is_active)
  const inactive = filtered.filter((t) => !t.is_active)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">Tipos de Plano</h1>
          <p className="text-portal-muted text-sm mt-1">Gerencie os modelos de plano disponiveis para contratacao</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Novo Tipo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-portal-muted text-sm">Filtrar:</span>
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              typeFilter === f.value
                ? 'bg-copper/15 text-copper'
                : 'text-portal-muted hover:text-portal-text hover:bg-portal-border/20'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Cards por tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {active.map((t) => (
              <div key={t.id} className="bg-portal-surface border border-portal-border rounded-xl p-5 hover:border-copper/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-portal-text font-semibold text-sm">{t.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-copper/15 text-copper capitalize">
                        {t.type}
                      </span>
                      {t.tier && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-portal-border/30 text-portal-muted capitalize">
                          {t.tier}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <ActionBtn title="Editar" color="text-copper" hoverColor="hover:text-copper-dark" onClick={() => { setEditing(t); setShowModal(true) }}>
                      <EditIcon />
                    </ActionBtn>
                    <ActionBtn
                      title="Desativar"
                      color="text-portal-muted"
                      hoverColor="hover:text-danger"
                      onClick={async () => {
                        if (!confirm(`Desativar "${t.name}"?`)) return
                        await apiFetch(`/api/plan-templates/${t.id}`, {
                          method: 'PUT',
                          body: JSON.stringify({ is_active: false }),
                        })
                        refetch()
                      }}
                    >
                      <DeactivateIcon />
                    </ActionBtn>
                  </div>
                </div>
                <p className="text-2xl font-bold text-portal-text mb-1">
                  R$ {Number(t.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  <span className="text-portal-muted text-xs font-normal">/mes</span>
                </p>
                {t.description && (
                  <p className="text-portal-muted text-xs mt-2 line-clamp-2">{t.description}</p>
                )}
              </div>
            ))}
          </div>

          {active.length === 0 && (
            <p className="text-portal-muted text-sm text-center py-8 bg-portal-surface border border-portal-border rounded-xl mb-8">
              Nenhum tipo de plano ativo. Crie um novo tipo para comecar.
            </p>
          )}

          {/* Inativos */}
          {inactive.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-portal-muted uppercase tracking-wider mb-3">Inativos</h2>
              <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-portal-border">
                    {inactive.map((t) => (
                      <tr key={t.id} className="hover:bg-portal-border/10 transition-colors">
                        <td className="px-6 py-3">
                          <p className="text-portal-muted text-sm">{t.name}</p>
                        </td>
                        <td className="px-6 py-3 text-portal-muted text-sm">
                          R$ {Number(t.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={async () => {
                              await apiFetch(`/api/plan-templates/${t.id}`, {
                                method: 'PUT',
                                body: JSON.stringify({ is_active: true }),
                              })
                              refetch()
                            }}
                            className="text-xs text-copper hover:text-copper-dark font-medium transition-colors"
                          >
                            Reativar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <TemplateModal
          template={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={() => { setShowModal(false); setEditing(null); refetch() }}
        />
      )}
    </div>
  )
}

function TemplateModal({ template, onClose, onSaved }) {
  const isEdit = !!template
  const [form, setForm] = useState({
    name: template?.name || '',
    type: template?.type || 'hosting',
    tier: template?.tier || '',
    monthly_value: template?.monthly_value || '',
    description: template?.description || '',
    is_active: template?.is_active ?? true,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      if (!payload.tier) payload.tier = null
      if (!payload.description) payload.description = null

      if (isEdit) {
        await apiFetch(`/api/plan-templates/${template.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/api/plan-templates', {
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

  const inputClass = "w-full px-3 py-2 bg-portal-bg border border-portal-border rounded-lg text-portal-text text-sm focus:outline-none focus:border-copper"
  const selectClass = `${inputClass} h-[38px]`

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-portal-surface border border-portal-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-portal-text mb-4">{isEdit ? 'Editar Tipo de Plano' : 'Novo Tipo de Plano'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Ex: Hosting Basico"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Tipo *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={selectClass}>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Tier</label>
              <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} className={selectClass}>
                {TIER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Valor mensal (R$) *</label>
            <input
              type="number"
              step="0.01"
              value={form.monthly_value}
              onChange={(e) => setForm({ ...form, monthly_value: e.target.value })}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Descricao</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Descreva o que esta incluso neste plano..."
              className={`${inputClass} resize-none`}
            />
          </div>
          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tpl_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-portal-border"
              />
              <label htmlFor="tpl_active" className="text-sm text-portal-text">Ativo</label>
            </div>
          )}
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-portal-muted text-sm hover:text-portal-text transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
