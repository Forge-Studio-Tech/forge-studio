import { useState } from 'react'
import { useApi, apiFetch } from '../../../hooks/useApi.js'
import { EditIcon, DeactivateIcon, ActionBtn } from '../../../components/portal/ActionIcons.jsx'

const TYPE_LABELS = { hosting: 'Hosting', maintenance: 'Manutencao', full: 'Completo' }
const TIER_LABELS = { basic: 'Basico', standard: 'Padrao', premium: 'Premium' }

export default function AdminPlans() {
  const { data, loading, refetch } = useApi('/api/plans')
  const { data: clientsData } = useApi('/api/clients')
  const { data: projectsData } = useApi('/api/projects')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const plans = data?.plans || []
  const clients = clientsData?.clients || []
  const projects = projectsData?.projects || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">Planos</h1>
          <p className="text-portal-muted text-sm mt-1">Gerencie planos e servicos contratados</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Novo Plano
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
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Projeto</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Valor</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Acao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-portal-muted text-sm">
                    Nenhum plano cadastrado.
                  </td>
                </tr>
              ) : (
                plans.map((p) => (
                  <tr key={p.id} className="hover:bg-portal-border/10 transition-colors">
                    <td className="px-6 py-4 text-portal-text text-sm font-medium">{p.client_name}</td>
                    <td className="px-6 py-4 text-portal-muted text-sm hidden md:table-cell">{p.project_name || '—'}</td>
                    <td className="px-6 py-4 text-portal-text text-sm">
                      {TYPE_LABELS[p.type] || p.type}
                      {p.tier && <span className="text-portal-muted"> / {TIER_LABELS[p.tier] || p.tier}</span>}
                    </td>
                    <td className="px-6 py-4 text-portal-text text-sm font-medium">
                      R$ {Number(p.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                        {p.is_active && (
                          <ActionBtn
                            title="Desativar"
                            color="text-portal-muted"
                            hoverColor="hover:text-danger"
                            onClick={async () => {
                              await apiFetch(`/api/plans/${p.id}`, {
                                method: 'PUT',
                                body: JSON.stringify({ is_active: false, ended_at: new Date().toISOString() }),
                              })
                              refetch()
                            }}
                          >
                            <DeactivateIcon />
                          </ActionBtn>
                        )}
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
  const [form, setForm] = useState({
    client_id: plan?.client_id || '',
    project_id: plan?.project_id || '',
    type: plan?.type || 'hosting',
    tier: plan?.tier || 'basic',
    monthly_value: plan?.monthly_value || '',
    started_at: plan?.started_at?.split('T')[0] || '',
    is_active: plan?.is_active ?? true,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const clientProjects = form.client_id
    ? projects.filter((p) => p.client_id === form.client_id)
    : []

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      if (!payload.project_id) delete payload.project_id
      if (!payload.started_at) delete payload.started_at

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

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-portal-surface border border-portal-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-portal-text mb-4">{isEdit ? 'Editar Plano' : 'Novo Plano'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Cliente *</label>
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value, project_id: '' })} required className={inputClass}>
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name || c.user_name}</option>
              ))}
            </select>
          </div>
          {clientProjects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Projeto vinculado</label>
              <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className={inputClass}>
                <option value="">Nenhum</option>
                {clientProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Tipo *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
                <option value="hosting">Hosting</option>
                <option value="maintenance">Manutencao</option>
                <option value="full">Completo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Tier</label>
              <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} className={inputClass}>
                <option value="basic">Basico</option>
                <option value="standard">Padrao</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Valor mensal (R$) *</label>
              <input type="number" step="0.01" value={form.monthly_value} onChange={(e) => setForm({ ...form, monthly_value: e.target.value })} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Inicio</label>
              <input type="date" value={form.started_at} onChange={(e) => setForm({ ...form, started_at: e.target.value })} className={inputClass} />
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
