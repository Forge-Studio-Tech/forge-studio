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

  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`rounded-xl border ${borderColor} bg-portal-surface overflow-hidden mb-8`}>
      {/* Header — sempre visível, clicável */}
      <div
        className="p-5 cursor-pointer hover:bg-portal-border/10 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${dotBg} ${site.status === 'offline' ? 'animate-pulse' : ''}`} />
            <div>
              <p className="text-portal-text font-semibold">{site.project_name}</p>
              <span className="text-portal-muted text-xs">
                {site.url?.replace(/^https?:\/\//, '')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {site.response_time_ms != null && (
              <span className="text-portal-muted text-xs">{site.response_time_ms}ms</span>
            )}
            <span className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</span>
            <svg className={`w-4 h-4 text-portal-muted transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expandido — stats + gráfico + incidentes */}
      {expanded && (
        <div className="border-t border-portal-border px-5 pb-4 pt-4 space-y-4">
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

          {history.length > 1 && (
            <div>
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

          {incidents.length > 0 && (
            <div>
              <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-1.5">Incidentes Recentes</p>
              <div className="space-y-1">
                {incidents.map((inc, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-danger/5 rounded-lg px-3 py-2">
                    <span className="text-portal-text">
                      {new Date(inc.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {inc.end ? ` — ${new Date(inc.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ' — em andamento'}
                    </span>
                    <span className="text-danger font-medium">{inc.duration_min} min</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link
            to="/portal/monitoring"
            className="block text-center text-copper hover:text-copper-dark text-xs pt-2"
          >
            Ver todos os detalhes →
          </Link>
        </div>
      )}
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
