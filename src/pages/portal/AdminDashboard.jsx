import { useNavigate, Link } from 'react-router-dom'
import { useApi } from '../../hooks/useApi.js'
import StatCard from '../../components/portal/StatCard.jsx'

export default function AdminDashboard() {
  const { data: clientsData } = useApi('/api/clients')
  const { data: projectsData } = useApi('/api/projects')
  const { data: summaryData } = useApi('/api/payments/summary')
  const { data: monitorData } = useApi('/api/monitoring')

  const navigate = useNavigate()
  const clients = clientsData?.clients || []
  const projects = projectsData?.projects || []
  const summary = summaryData?.summary || {}

  const activeProjects = projects.filter((p) => p.status !== 'maintenance')

  const monitorSites = monitorData?.sites || []
  const sitesOnline = monitorSites.filter((s) => s.status === 'online').length
  const sitesOffline = monitorSites.filter((s) => s.status === 'offline').length
  const hasOffline = sitesOffline > 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-portal-text mb-1">Mission Control</h1>
      <p className="text-portal-muted text-sm mb-8">Visao geral da Forge Studio</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="MRR"
          value={`R$ ${Number(summary.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          accent
        />
        <StatCard
          label="Pendentes"
          value={`${summary.pending_count || 0} (R$ ${Number(summary.pending_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`}
        />
        <StatCard label="Projetos Ativos" value={String(activeProjects.length)} />
        <StatCard label="Clientes" value={String(clients.length)} />
      </div>

      {/* Alertas de atraso */}
      {Number(summary.overdue_count) > 0 && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-8">
          <p className="text-danger font-medium text-sm">
            {summary.overdue_count} pagamento(s) atrasado(s) — total R$ {Number(summary.overdue_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}

      {/* Card monitoramento */}
      {monitorSites.length > 0 && (
        <Link
          to="/portal/admin/monitoring"
          className={`block rounded-xl border p-4 mb-8 transition-colors hover:border-copper/40 ${
            hasOffline
              ? 'bg-danger/5 border-danger/30'
              : 'bg-success/5 border-success/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${hasOffline ? 'bg-danger animate-pulse' : 'bg-success'}`} />
              <span className="text-portal-text text-sm font-medium">
                {hasOffline
                  ? `${sitesOffline} site(s) offline, ${sitesOnline} online`
                  : `${sitesOnline} site(s) online`
                }
              </span>
            </div>
            <span className="text-portal-muted text-xs">Ver detalhes →</span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projetos recentes */}
        <section>
          <h2 className="text-lg font-semibold text-portal-text mb-4">Projetos Recentes</h2>
          <div className="bg-portal-surface border border-portal-border rounded-xl divide-y divide-portal-border">
            {projects.length === 0 ? (
              <p className="text-portal-muted text-sm text-center p-6">Nenhum projeto cadastrado.</p>
            ) : (
              projects.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-portal-border/10 transition-colors"
                  onClick={() => navigate(`/portal/projects/${p.id}`)}
                >
                  <div>
                    <p className="text-portal-text text-sm font-medium">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-portal-muted text-xs">{p.client_name}</span>
                      {p.production_url && (
                        <a href={p.production_url} target="_blank" rel="noopener noreferrer" className={`text-xs font-medium transition-colors ${p.status === 'published' ? 'text-success hover:text-success/80' : 'text-copper hover:text-copper-dark'}`}>
                          Site
                        </a>
                      )}
                      {p.preview_url && (
                        <a href={p.preview_url} target="_blank" rel="noopener noreferrer" className="text-copper hover:text-copper-dark text-xs font-medium transition-colors">
                          Preview
                        </a>
                      )}
                    </div>
                  </div>
                  <StatusPill status={p.status} />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Clientes */}
        <section>
          <h2 className="text-lg font-semibold text-portal-text mb-4">Clientes</h2>
          <div className="bg-portal-surface border border-portal-border rounded-xl divide-y divide-portal-border">
            {clients.length === 0 ? (
              <p className="text-portal-muted text-sm text-center p-6">Nenhum cliente cadastrado.</p>
            ) : (
              clients.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-portal-border/10 transition-colors"
                  onClick={() => navigate(`/portal/admin/clients/${c.id}`)}
                >
                  <div>
                    <p className="text-portal-text text-sm font-medium">{c.company_name || c.user_name}</p>
                    <p className="text-portal-muted text-xs">{c.email}</p>
                  </div>
                  <span className="text-portal-muted text-xs">{c.project_count} projeto(s)</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

const STATUS_LABELS = {
  briefing: 'Briefing',
  design: 'Design',
  development: 'Desenvolvimento',
  review: 'Revisao',
  published: 'Publicado',
  maintenance: 'Manutencao',
}

const STATUS_COLORS = {
  briefing: 'bg-portal-border/50 text-portal-muted',
  design: 'bg-warning/15 text-warning',
  development: 'bg-copper/15 text-copper',
  review: 'bg-warning/15 text-warning',
  published: 'bg-success/15 text-success',
  maintenance: 'bg-portal-border/50 text-portal-muted',
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || ''}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}
