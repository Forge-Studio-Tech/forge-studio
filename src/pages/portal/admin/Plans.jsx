import { useState, useEffect } from 'react'
import { useApi, apiFetch } from '../../../hooks/useApi.js'
import { EditIcon, DeactivateIcon, ActionBtn } from '../../../components/portal/ActionIcons.jsx'

const TYPE_LABELS = { hosting: 'Hosting', maintenance: 'Manutenção', full: 'Completo' }
const TIER_LABELS = { basic: 'Básico', standard: 'Padrão', premium: 'Premium' }

function DeleteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function RestoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  )
}

export default function AdminPlans() {
  const { data, loading, refetch } = useApi('/api/plans')
  const { data: clientsData } = useApi('/api/clients')
  const { data: projectsData } = useApi('/api/projects')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('active')

  const allPlans = data?.plans || []
  const plans = filter === 'all' ? allPlans : allPlans.filter((p) => filter === 'active' ? p.is_active : !p.is_active)
  const activeCount = allPlans.filter((p) => p.is_active).length
  const inactiveCount = allPlans.filter((p) => !p.is_active).length
  const clients = clientsData?.clients || []
  const projects = projectsData?.projects || []

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">Planos</h1>
          <p className="text-portal-muted text-sm mt-1">Gerencie planos e serviços contratados</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Novo Plano
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { key: 'active', label: `Ativos (${activeCount})` },
          { key: 'inactive', label: `Inativos (${inactiveCount})` },
          { key: 'all', label: `Todos (${allPlans.length})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.key ? 'bg-copper/15 text-copper' : 'text-portal-muted hover:text-portal-text'}`}
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
        <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-portal-border">
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Cliente</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Projeto</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Valor</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden lg:table-cell">Cobrança</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-portal-muted text-sm">
                    Nenhum plano {filter === 'active' ? 'ativo' : filter === 'inactive' ? 'inativo' : 'cadastrado'}.
                  </td>
                </tr>
              ) : (
                plans.map((p) => (
                  <tr key={p.id} className={`hover:bg-portal-border/10 transition-colors ${!p.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 text-portal-text text-sm font-medium">{p.client_name}</td>
                    <td className="px-6 py-4 text-portal-muted text-sm hidden md:table-cell">{p.project_name || '—'}</td>
                    <td className="px-6 py-4 text-portal-text text-sm">
                      {TYPE_LABELS[p.type] || p.type}
                      {p.tier && <span className="text-portal-muted"> / {TIER_LABELS[p.tier] || p.tier}</span>}
                    </td>
                    <td className="px-6 py-4 text-portal-text text-sm font-medium">
                      R$ {Number(p.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-portal-muted text-sm hidden lg:table-cell">
                      Dia {p.billing_day || 28}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-success/15 text-success' : 'bg-portal-border/50 text-portal-muted'}`}>
                        {p.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <ActionBtn title="Editar" color="text-copper" hoverColor="hover:text-copper-dark" onClick={() => { setEditing(p); setShowModal(true) }}>
                          <EditIcon />
                        </ActionBtn>
                        {p.is_active ? (
                          <ActionBtn
                            title="Desativar"
                            color="text-portal-muted"
                            hoverColor="hover:text-warning"
                            onClick={async () => {
                              await apiFetch(`/api/plans/${p.id}`, {
                                method: 'PUT',
                                body: JSON.stringify({ is_active: false, ends_at: new Date().toISOString().split('T')[0] }),
                              })
                              refetch()
                            }}
                          >
                            <DeactivateIcon />
                          </ActionBtn>
                        ) : (
                          <>
                            <ActionBtn
                              title="Reativar"
                              color="text-portal-muted"
                              hoverColor="hover:text-success"
                              onClick={async () => {
                                await apiFetch(`/api/plans/${p.id}`, {
                                  method: 'PUT',
                                  body: JSON.stringify({ is_active: true, ends_at: null }),
                                })
                                refetch()
                              }}
                            >
                              <RestoreIcon />
                            </ActionBtn>
                            <ActionBtn
                              title="Excluir"
                              color="text-portal-muted"
                              hoverColor="hover:text-danger"
                              onClick={async () => {
                                if (!confirm('Excluir este plano permanentemente?')) return
                                try {
                                  await apiFetch(`/api/plans/${p.id}`, { method: 'DELETE' })
                                  refetch()
                                } catch (err) {
                                  alert(err.message)
                                }
                              }}
                            >
                              <DeleteIcon />
                            </ActionBtn>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {showModal && (
        <PlanModal
          plan={editing}
          clients={clients}
          projects={projects}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={() => { setShowModal(false); setEditing(null); refetch() }}
        />
      )}
    </div>
  )
}

function PlanModal({ plan, clients, projects, onClose, onSaved }) {
  const isEdit = !!plan
  const { data: templatesData } = useApi('/api/plan-templates')
  const templates = (templatesData?.templates || []).filter((t) => t.is_active)

  const matchingTemplate = isEdit
    ? templates.find((t) => t.type === plan.type && t.tier === plan.tier)
    : null

  const [form, setForm] = useState({
    client_id: plan?.client_id || '',
    project_id: plan?.project_id || '',
    template_id: matchingTemplate?.id || '',
    type: plan?.type || '',
    tier: plan?.tier || '',
    monthly_value: plan?.monthly_value || '',
    billing_day: plan?.billing_day || 28,
    started_at: plan?.started_at?.split('T')[0] || '',
    ends_at: plan?.ends_at?.split('T')[0] || '',
    is_active: plan?.is_active ?? true,
  })
  const [valueOverridden, setValueOverridden] = useState(isEdit)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit && templates.length > 0 && !form.template_id) {
      const match = templates.find((t) => t.type === plan.type && t.tier === plan.tier)
      if (match) {
        setForm((f) => ({ ...f, template_id: match.id }))
      }
    }
  }, [templates])

  const currentTemplate = templates.find((t) => t.id === form.template_id)
  const tableValue = currentTemplate ? Number(currentTemplate.monthly_value) : null
  const isCustomValue = tableValue !== null && Number(form.monthly_value) !== tableValue

  function handleTemplateChange(templateId) {
    const tpl = templates.find((t) => t.id === templateId)
    if (tpl) {
      setForm((f) => ({
        ...f,
        template_id: templateId,
        type: tpl.type,
        tier: tpl.tier || '',
        monthly_value: valueOverridden ? f.monthly_value : tpl.monthly_value,
      }))
      if (!valueOverridden) {
        setForm((f) => ({ ...f, monthly_value: tpl.monthly_value }))
      }
    } else {
      setForm((f) => ({ ...f, template_id: '', type: '', tier: '' }))
    }
  }

  const clientProjects = form.client_id
    ? projects.filter((p) => p.client_id === form.client_id)
    : []

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        client_id: form.client_id,
        project_id: form.project_id || null,
        type: form.type,
        tier: form.tier || null,
        monthly_value: form.monthly_value,
        billing_day: parseInt(form.billing_day, 10),
        started_at: form.started_at || null,
        ends_at: form.ends_at || null,
        is_active: form.is_active,
      }
      if (!payload.project_id) delete payload.project_id
      if (!payload.started_at) delete payload.started_at
      if (!payload.ends_at) delete payload.ends_at

      if (isEdit) {
        await apiFetch(`/api/plans/${plan.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/api/plans', {
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
        <h2 className="text-lg font-bold text-portal-text mb-4">{isEdit ? 'Editar Plano' : 'Novo Plano'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Cliente *</label>
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value, project_id: '' })} required className={selectClass}>
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name || c.user_name}</option>
              ))}
            </select>
          </div>
          {clientProjects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Projeto vinculado</label>
              <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className={selectClass}>
                <option value="">Nenhum</option>
                {clientProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Tipo de Plano *</label>
            <select
              value={form.template_id}
              onChange={(e) => handleTemplateChange(e.target.value)}
              required
              className={selectClass}
            >
              <option value="">Selecione um plano...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — R$ {Number(t.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mes
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">
                Valor mensal (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.monthly_value}
                onChange={(e) => {
                  setForm({ ...form, monthly_value: e.target.value })
                  setValueOverridden(true)
                }}
                required
                className={inputClass}
              />
              {isCustomValue && (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-warning text-xs">
                    Valor customizado (tabela: R$ {tableValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, monthly_value: currentTemplate.monthly_value }))
                      setValueOverridden(false)
                    }}
                    className="text-copper text-xs hover:text-copper-dark transition-colors"
                  >
                    Restaurar
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Dia de cobrança *</label>
              <select value={form.billing_day} onChange={(e) => setForm({ ...form, billing_day: e.target.value })} className={selectClass}>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
              {parseInt(form.billing_day) > 28 && (
                <p className="text-portal-muted text-xs mt-1">Em fev. será cobrado no último dia</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Inicio</label>
              <input type="date" value={form.started_at} onChange={(e) => setForm({ ...form, started_at: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Fim do plano</label>
              <input type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className={inputClass} />
              <p className="text-portal-muted text-xs mt-1">Vazio = indeterminado</p>
            </div>
          </div>
          {isEdit && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-portal-border"
              />
              <label htmlFor="is_active" className="text-sm text-portal-text">Plano ativo</label>
            </div>
          )}
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-portal-muted text-sm hover:text-portal-text transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Plano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
