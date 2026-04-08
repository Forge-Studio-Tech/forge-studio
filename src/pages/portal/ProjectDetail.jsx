import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth.jsx'
import { useApi, apiFetch } from '../../hooks/useApi.js'

const STEPS = ['briefing', 'design', 'development', 'review', 'published']
const STEP_LABELS = {
  briefing: 'Briefing', design: 'Design', development: 'Desenvolvimento',
  review: 'Revisão', published: 'Publicado',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { data, loading, error, refetch } = useApi(`/api/projects/${id}`)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/30 rounded-xl p-6 text-center">
        <p className="text-danger text-sm">{error}</p>
        <Link to="/portal/projects" className="text-copper text-sm mt-2 inline-block">Voltar aos projetos</Link>
      </div>
    )
  }

  const project = data?.project
  if (!project) return null

  const currentStepIndex = STEPS.indexOf(project.status)

  async function handleStatusChange(newStatus) {
    setUpdatingStatus(true)
    try {
      await apiFetch(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      refetch()
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div>
      <Link to="/portal/projects" className="text-portal-muted hover:text-copper text-sm mb-4 inline-block transition-colors">
        &larr; Voltar
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">{project.name}</h1>
          {project.client_name && <p className="text-portal-muted text-sm mt-1">{project.client_name}</p>}
        </div>
        <span className="text-portal-muted text-sm">{project.type?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
      </div>

      {/* Timeline de status */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-portal-text mb-4">Progresso</h2>
        <div className="bg-portal-surface border border-portal-border rounded-xl p-6">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            {STEPS.map((step, i) => {
              const isLast = i === STEPS.length - 1
              const isActive = i === currentStepIndex && !isLast
              const isDone = i < currentStepIndex || (i === currentStepIndex && isLast)
              return (
                <div key={step} className="flex items-center gap-1 sm:gap-2">
                  {isAdmin ? (
                    <button
                      onClick={() => handleStatusChange(step)}
                      disabled={updatingStatus || isActive}
                      className={`
                        inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors
                        ${isActive ? 'bg-copper/15 text-copper ring-1 ring-copper/30' : isDone ? 'bg-success/15 text-success hover:bg-success/25' : 'bg-portal-border/30 text-portal-muted hover:bg-portal-border/50'}
                        ${!isActive ? 'cursor-pointer' : 'cursor-default'}
                        disabled:opacity-50
                      `}
                    >
                      {isDone ? '✓ ' : ''}{STEP_LABELS[step]}
                    </button>
                  ) : (
                    <span className={`
                      inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors
                      ${isActive ? 'bg-copper/15 text-copper' : isDone ? 'bg-success/15 text-success' : 'bg-portal-border/30 text-portal-muted'}
                    `}>
                      {isDone ? '✓ ' : ''}{STEP_LABELS[step]}
                    </span>
                  )}
                  {i < STEPS.length - 1 && <div className="w-3 sm:w-6 h-px bg-portal-border" />}
                </div>
              )
            })}
          </div>
          {isAdmin && <p className="text-portal-muted text-xs mt-3">Clique em um status para alterar</p>}
        </div>
      </section>

      {/* Detalhes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-portal-surface border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-portal-text mb-4">Detalhes</h2>
          <dl className="space-y-3">
            {project.domain && <Detail label="Domínio" value={project.domain} />}
            {project.preview_url && (
              <Detail label="Preview" value={
                <a href={project.preview_url} target="_blank" rel="noopener noreferrer" className="text-copper hover:text-copper-dark transition-colors">
                  {project.preview_url}
                </a>
              } />
            )}
            {project.production_url && (
              <Detail label="Producao" value={
                <a href={project.production_url} target="_blank" rel="noopener noreferrer" className="text-copper hover:text-copper-dark transition-colors">
                  {project.production_url}
                </a>
              } />
            )}
            {project.started_at && <Detail label="Inicio" value={new Date(project.started_at).toLocaleDateString('pt-BR')} />}
            {project.delivered_at && <Detail label="Entrega" value={new Date(project.delivered_at).toLocaleDateString('pt-BR')} />}
          </dl>
        </section>

        <section className="bg-portal-surface border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-portal-text mb-4">Informações</h2>
          <dl className="space-y-3">
            <Detail label="Tipo" value={project.type?.replace('_', ' ')} />
            <Detail label="Status" value={STEP_LABELS[project.status] || project.status} />
            <Detail label="Criado em" value={new Date(project.created_at).toLocaleDateString('pt-BR')} />
          </dl>
        </section>
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium text-portal-muted uppercase tracking-wider">{label}</dt>
      <dd className="text-portal-text text-sm mt-0.5">{value}</dd>
    </div>
  )
}
