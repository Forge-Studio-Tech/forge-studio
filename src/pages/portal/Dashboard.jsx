import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth.jsx'
import { useApi } from '../../hooks/useApi.js'
import { Link } from 'react-router-dom'
import AdminDashboard from './AdminDashboard.jsx'
import StatCard from '../../components/portal/StatCard.jsx'

export default function Dashboard() {
  const { user, impersonating } = useAuth()

  if (user?.role === 'admin' && !impersonating) {
    return <AdminDashboard />
  }

  return <ClientDashboard user={user} />
}

function ClientDashboard({ user }) {
  const { data: projectsData, loading: loadingProjects } = useApi('/api/projects')
  const { data: paymentsData, loading: loadingPayments } = useApi('/api/payments')
  const { data: monitorData } = useApi('/api/monitoring')

  const projects = projectsData?.projects || []
  const payments = paymentsData?.payments || []
  const pendingPayments = payments.filter((p) => p.status === 'pending')
  const nextPayment = pendingPayments.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0]

  const monitorSites = monitorData?.sites || []
  const firstSite = monitorSites[0]

  return (
    <div>
      <h1 className="text-2xl font-bold text-portal-text mb-1">
        Ola, {user?.name?.split(' ')[0]}
      </h1>
      <p className="text-portal-muted text-sm mb-8">
        Acompanhe seus projetos e pagamentos
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Projetos Ativos" value={loadingProjects ? '...' : String(projects.length)} />
        <StatCard
          label="Próximo Pagamento"
          value={loadingPayments ? '...' : nextPayment
            ? `R$ ${Number(nextPayment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : 'Nenhum'}
          subtitle={nextPayment?.due_date
            ? `Vencimento: ${new Date(nextPayment.due_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`
            : null}
        />
        <StatCard label="Pagamentos Pendentes" value={loadingPayments ? '...' : String(pendingPayments.length)} />
      </div>

      {/* Monitoramento detalhado */}
      {firstSite && (
        <MonitoringCard site={firstSite} />
      )}

      <section>
        <h2 className="text-lg font-semibold text-portal-text mb-4">Meus Projetos</h2>
        {projects.length === 0 ? (
          <div className="bg-portal-surface border border-portal-border rounded-xl p-8 text-center">
            <p className="text-portal-muted text-sm">Nenhum projeto encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <Link
                key={p.id}
                to={`/portal/projects/${p.id}`}
                className="bg-portal-surface border border-portal-border rounded-xl p-5 hover:border-copper/40 transition-colors block"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-portal-text font-semibold text-sm">{p.name}</h3>
                  <StatusPill status={p.status} />
                </div>
                {p.production_url && (
                  <p className="text-portal-muted text-xs truncate">{p.production_url}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function MonitoringCard({ site }) {
  const { data } = useApi(`/api/monitoring/${site.project_id}`)
  const [, setTick] = useState(0)

  // Auto-refresh a cada 2 min
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const detail = data?.site
  const history = data?.history || []
  const incidents = data?.incidents || []

  const dotBg = site.status === 'online' ? 'bg-success' : site.status === 'offline' ? 'bg-danger' : 'bg-portal-muted'
  const borderColor = site.status === 'offline' ? 'border-danger/30' : 'border-success/30'
  const statusLabel = site.status === 'online' ? 'Online' : site.status === 'offline' ? 'Fora do ar' : 'Desconhecido'
  const statusColor = site.status === 'online' ? 'text-success' : site.status === 'offline' ? 'text-danger' : 'text-portal-muted'

  return (
    <div className={`rounded-xl border ${borderColor} bg-portal-surface overflow-hidden mb-8`}>
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${dotBg} ${site.status === 'offline' ? 'animate-pulse' : ''}`} />
            <div>
              <p className="text-portal-text font-semibold">{site.project_name}</p>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-copper hover:text-copper-dark text-xs"
              >
                {site.url?.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>
          <span className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-portal-bg rounded-lg p-3">
            <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-0.5">Uptime 24h</p>
            <p className={`text-lg font-bold ${
              detail?.uptime_24h >= 99.9 ? 'text-success' : detail?.uptime_24h >= 99 ? 'text-warning' : detail ? 'text-danger' : 'text-portal-muted'
            }`}>
              {detail ? `${detail.uptime_24h}%` : '...'}
            </p>
          </div>
          <div className="bg-portal-bg rounded-lg p-3">
            <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-0.5">Resposta</p>
            <p className="text-lg font-bold text-portal-text">
              {site.response_time_ms != null ? `${site.response_time_ms}ms` : '—'}
            </p>
          </div>
          <div className="bg-portal-bg rounded-lg p-3">
            <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-0.5">Incidentes</p>
            <p className={`text-lg font-bold ${incidents.length > 0 ? 'text-danger' : 'text-success'}`}>
              {data ? incidents.length : '...'}
            </p>
          </div>
        </div>
      </div>

      {/* Mini gráfico */}
      {history.length > 1 && (
        <div className="px-5 pb-2">
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-1.5">Tempo de Resposta (24h)</p>
          <div className="bg-portal-bg rounded-lg p-2">
            <svg viewBox="0 0 600 60" className="w-full h-12" preserveAspectRatio="none">
              {(() => {
                const step = Math.max(1, Math.floor(history.length / 100))
                const sampled = history.filter((_, i) => i % step === 0)
                const maxMs = Math.max(...sampled.map((h) => h.response_time_ms))
                const w = 600
                const h = 60
                return (
                  <polyline
                    fill="none"
                    stroke="#D5851E"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                    points={sampled.map((pt, i) => `${(i / (sampled.length - 1)) * w},${h - 4 - (pt.response_time_ms / maxMs) * (h - 8)}`).join(' ')}
                  />
                )
              })()}
            </svg>
          </div>
        </div>
      )}

      {/* Footer link */}
      <Link
        to="/portal/monitoring"
        className="block text-center text-copper hover:text-copper-dark text-xs py-3 border-t border-portal-border/50 transition-colors"
      >
        Ver todos os detalhes →
      </Link>
    </div>
  )
}

const STATUS_LABELS = {
  briefing: 'Briefing', design: 'Design', development: 'Desenvolvimento',
  review: 'Revisão', published: 'Publicado', maintenance: 'Manutenção',
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
