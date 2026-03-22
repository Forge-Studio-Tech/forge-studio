import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth.jsx'
import { useApi, apiFetch } from '../../hooks/useApi.js'
import { EditIcon, ArchiveIcon, RestoreIcon, ActionBtn } from '../../components/portal/ActionIcons.jsx'

const STATUS_LABELS = {
  briefing: 'Briefing', design: 'Design', development: 'Desenvolvimento',
  review: 'Revisao', published: 'Publicado', maintenance: 'Manutencao',
  archived: 'Arquivado',
}
const STATUS_COLORS = {
  briefing: 'bg-portal-border/50 text-portal-muted',
  design: 'bg-warning/15 text-warning',
  development: 'bg-copper/15 text-copper',
  review: 'bg-warning/15 text-warning',
  published: 'bg-success/15 text-success',
  maintenance: 'bg-portal-border/50 text-portal-muted',
  archived: 'bg-portal-border/30 text-portal-muted',
}

export default function Projects() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [showArchived, setShowArchived] = useState(false)
  const { data, loading, refetch } = useApi(`/api/projects${showArchived ? '?archived=true' : ''}`)
  const { data: clientsData } = useApi('/api/clients', { skip: !isAdmin })
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const projects = data?.projects || []
  const clients = clientsData?.clients || []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">
            {isAdmin ? 'Todos os Projetos' : 'Meus Projetos'}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-portal-muted text-sm">
              {isAdmin ? 'Gerencie projetos de todos os clientes' : 'Acompanhe o status dos seus projetos'}
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="text-xs text-portal-muted hover:text-copper transition-colors"
              >
                {showArchived ? 'Ocultar arquivados' : 'Ver arquivados'}
              </button>
            )}
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditing(null); setShowModal(true) }}
            className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Novo Projeto
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-portal-surface border border-portal-border rounded-xl p-8 text-center">
          <p className="text-portal-muted text-sm">Nenhum projeto cadastrado.</p>
        </div>
      ) : (
        <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-portal-border">
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Projeto</th>
                {isAdmin && <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Cliente</th>}
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Links</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Tipo</th>
                {isAdmin && <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Acao</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-portal-border/10 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/portal/projects/${p.id}`} className="text-portal-text text-sm font-medium hover:text-copper transition-colors">
                      {p.name}
                    </Link>
                    {p.domain && <p className="text-portal-muted text-xs">{p.domain}</p>}
                  </td>
                  {isAdmin && <td className="px-6 py-4 text-portal-muted text-sm hidden md:table-cell">{p.client_name}</td>}
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || ''}`}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      {p.production_url && (
                        <a href={p.production_url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${p.status === 'published' ? 'text-success hover:text-success/80' : 'text-copper hover:text-copper-dark'}`}>
                          <LinkIcon />Site
                        </a>
                      )}
                      {p.preview_url && (
                        <a href={p.preview_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-copper hover:text-copper-dark text-xs font-medium transition-colors">
                          <LinkIcon />Preview
                        </a>
                      )}
                      {!p.production_url && !p.preview_url && <span className="text-portal-muted text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-portal-muted text-sm capitalize hidden md:table-cell">{p.type?.replace('_', ' ')}</td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <ActionBtn title="Editar" color="text-copper" hoverColor="hover:text-copper-dark" onClick={() => { setEditing(p); setShowModal(true) }}>
                          <EditIcon />
                        </ActionBtn>
                        <ActionBtn
                          title={p.status === 'archived' ? 'Restaurar' : 'Arquivar'}
                          color={p.status === 'archived' ? 'text-success' : 'text-portal-muted'}
                          hoverColor={p.status === 'archived' ? 'hover:text-success/80' : 'hover:text-danger'}
                          onClick={async () => {
                            const isArchived = p.status === 'archived'
                            const action = isArchived ? 'restaurar' : 'arquivar'
                            if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} este projeto?`)) return
                            try {
                              await apiFetch(`/api/projects/${p.id}`, {
                                method: 'PUT',
                                body: JSON.stringify({ status: isArchived ? 'briefing' : 'archived' }),
                              })
                              refetch()
                            } catch (err) {
                              alert('Erro: ' + err.message)
                            }
                          }}
                        >
                          {p.status === 'archived' ? <RestoreIcon /> : <ArchiveIcon />}
                        </ActionBtn>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ProjectModal
          project={editing}
          clients={clients}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={() => { setShowModal(false); setEditing(null); refetch() }}
        />
      )}
    </div>
  )
}

function ProjectModal({ project, clients, onClose, onSaved }) {
  const isEdit = !!project
  const [form, setForm] = useState({
    client_id: project?.client_id || '',
    name: project?.name || '',
    type: project?.type || 'site',
    status: project?.status || 'briefing',
    domain: project?.domain || '',
    preview_url: project?.preview_url || '',
    production_url: project?.production_url || '',
    started_at: project?.started_at?.split('T')[0] || '',
    delivered_at: project?.delivered_at?.split('T')[0] || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      if (!payload.started_at) delete payload.started_at
      if (!payload.delivered_at) delete payload.delivered_at
      if (!payload.domain) delete payload.domain
      if (!payload.preview_url) delete payload.preview_url
      if (!payload.production_url) delete payload.production_url

      if (isEdit) {
        await apiFetch(`/api/projects/${project.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/api/projects', {
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
        <h2 className="text-lg font-bold text-portal-text mb-4">{isEdit ? 'Editar Projeto' : 'Novo Projeto'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Cliente</label>
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required disabled={isEdit} className={`${inputClass} disabled:opacity-50`}>
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name || c.user_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Nome do Projeto</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
                <option value="landing_page">Landing Page</option>
                <option value="site">Site</option>
                <option value="system">Sistema</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                <option value="briefing">Briefing</option>
                <option value="design">Design</option>
                <option value="development">Desenvolvimento</option>
                <option value="review">Revisao</option>
                <option value="published">Publicado</option>
                <option value="maintenance">Manutencao</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Dominio</label>
            <input type="text" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="exemplo.com.br" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">URL Preview</label>
            <input type="url" value={form.preview_url} onChange={(e) => setForm({ ...form, preview_url: e.target.value })} placeholder="https://preview..." className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">URL Producao</label>
            <input type="url" value={form.production_url} onChange={(e) => setForm({ ...form, production_url: e.target.value })} placeholder="https://..." className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Inicio</label>
              <input type="date" value={form.started_at} onChange={(e) => setForm({ ...form, started_at: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Entrega</label>
              <input type="date" value={form.delivered_at} onChange={(e) => setForm({ ...form, delivered_at: e.target.value })} className={inputClass} />
            </div>
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-portal-muted text-sm hover:text-portal-text transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LinkIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  )
}
