import { useState, useEffect } from 'react'
import { useApi } from '../../../hooks/useApi.js'

export default function Monitoring() {
  const { data, loading, error, refetch } = useApi('/api/monitoring')
  const sites = data?.sites || []
  const [expanded, setExpanded] = useState(null)

  // Auto-refresh a cada 2 min
  useEffect(() => {
    const interval = setInterval(refetch, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refetch])

  const onlineCount = sites.filter((s) => s.status === 'online').length
  const offlineCount = sites.filter((s) => s.status === 'offline').length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">Monitoramento</h1>
          <p className="text-portal-muted text-sm mt-1">Status dos sites dos clientes</p>
        </div>
        {sites.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            {onlineCount > 0 && (
              <span className="flex items-center gap-1.5 text-success">
                <span className="w-2 h-2 rounded-full bg-success" />
                {onlineCount} online
              </span>
            )}
            {offlineCount > 0 && (
              <span className="flex items-center gap-1.5 text-danger">
                <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                {offlineCount} offline
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-portal-muted text-sm">Carregando...</p>
      ) : error ? (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4">
          <p className="text-danger text-sm">{error}</p>
        </div>
      ) : sites.length === 0 ? (
        <div className="bg-portal-surface border border-portal-border rounded-xl p-8 text-center">
          <p className="text-portal-muted text-sm">Nenhum site monitorado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <SiteCard
              key={site.project_id}
              site={site}
              isExpanded={expanded === site.project_id}
              onToggle={() => setExpanded(expanded === site.project_id ? null : site.project_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SiteCard({ site, isExpanded, onToggle }) {
  const statusColor = site.status === 'online' ? 'text-success' : site.status === 'offline' ? 'text-danger' : 'text-portal-muted'
  const statusBg = site.status === 'online' ? 'bg-success/15' : site.status === 'offline' ? 'bg-danger/15' : 'bg-portal-border/50'
  const dotBg = site.status === 'online' ? 'bg-success' : site.status === 'offline' ? 'bg-danger' : 'bg-portal-muted'
  const statusLabel = site.status === 'online' ? 'Online' : site.status === 'offline' ? 'Offline' : 'Desconhecido'

  const rtColor = site.response_time_ms == null
    ? 'text-portal-muted'
    : site.response_time_ms < 500
      ? 'text-success'
      : site.response_time_ms < 1500
        ? 'text-warning'
        : 'text-danger'

  const timeAgo = site.last_check ? getTimeAgo(new Date(site.last_check)) : '—'

  return (
    <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-portal-border/10 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <p className="text-portal-text font-semibold text-sm truncate">{site.project_name}</p>
            <p className="text-portal-muted text-xs truncate">{site.client_name}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotBg} ${site.status === 'offline' ? 'animate-pulse' : ''}`} />
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-copper hover:text-copper-dark truncate max-w-[200px]"
            onClick={(e) => e.stopPropagation()}
          >
            {site.url?.replace(/^https?:\/\//, '')}
          </a>
          <div className="flex items-center gap-3 shrink-0 ml-2">
            {site.response_time_ms != null && (
              <span className={`font-medium ${rtColor}`}>{site.response_time_ms}ms</span>
            )}
            <span className="text-portal-muted">{timeAgo}</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <SiteDetail projectId={site.project_id} />
      )}
    </div>
  )
}

function SiteDetail({ projectId }) {
  const { data, loading } = useApi(`/api/monitoring/${projectId}`)

  if (loading) {
    return <div className="px-5 pb-5 text-portal-muted text-xs">Carregando detalhes...</div>
  }

  if (!data) return null

  const { site, history, incidents } = data

  return (
    <div className="border-t border-portal-border px-5 pb-5 pt-4 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-portal-bg rounded-lg p-3">
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-0.5">Uptime 24h</p>
          <p className={`text-lg font-bold ${site.uptime_24h >= 99.9 ? 'text-success' : site.uptime_24h >= 99 ? 'text-warning' : 'text-danger'}`}>
            {site.uptime_24h}%
          </p>
        </div>
        <div className="bg-portal-bg rounded-lg p-3">
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-0.5">Tempo de Resposta</p>
          <p className="text-lg font-bold text-portal-text">
            {site.response_time_ms != null ? `${site.response_time_ms}ms` : '—'}
          </p>
        </div>
      </div>

      {/* Gráfico SVG de response time */}
      {history.length > 0 && (
        <ResponseChart history={history} />
      )}

      {/* Incidentes */}
      {incidents.length > 0 && (
        <div>
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-2">Incidentes (24h)</p>
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
    </div>
  )
}

function ResponseChart({ history }) {
  const step = Math.max(1, Math.floor(history.length / 100))
  const sampled = history.filter((_, i) => i % step === 0)
  const maxMs = Math.max(...sampled.map((h) => h.response_time_ms))
  const chartHeight = 80

  return (
    <div>
      <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-2">Tempo de Resposta (24h)</p>
      <div className="bg-portal-bg rounded-lg p-3">
        <svg viewBox={`0 0 600 ${chartHeight}`} className="w-full h-20" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#D5851E"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            points={sampled.map((h, i) => `${(i / (sampled.length - 1)) * 600},${chartHeight - 4 - (h.response_time_ms / maxMs) * (chartHeight - 8)}`).join(' ')}
          />
        </svg>
        <div className="flex justify-between text-[10px] text-portal-muted mt-1">
          <span>{new Date(sampled[0].timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{new Date(sampled[sampled.length - 1].timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date) / 1000)
  if (seconds < 60) return 'agora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `há ${hours}h`
}
