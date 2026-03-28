import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi.js'

export default function ClientMonitoring() {
  const { data, loading, error, refetch } = useApi('/api/monitoring')
  const sites = data?.sites || []
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    const interval = setInterval(refetch, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refetch])

  return (
    <div>
      <h1 className="text-2xl font-bold text-portal-text mb-1">Monitoramento</h1>
      <p className="text-portal-muted text-sm mb-8">Status dos seus sites</p>

      {loading ? (
        <p className="text-portal-muted text-sm">Carregando...</p>
      ) : error ? (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4">
          <p className="text-danger text-sm">{error}</p>
        </div>
      ) : sites.length === 0 ? (
        <div className="bg-portal-surface border border-portal-border rounded-xl p-8 text-center">
          <p className="text-portal-muted text-sm">Nenhum site monitorado no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sites.map((site) => (
            <ClientSiteCard
              key={site.project_id}
              site={site}
              isExpanded={selectedId === site.project_id}
              onToggle={() => setSelectedId(selectedId === site.project_id ? null : site.project_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ClientSiteCard({ site, isExpanded, onToggle }) {
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
                onClick={(e) => e.stopPropagation()}
              >
                {site.url?.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
              {statusLabel}
            </span>
            <div className="flex items-center gap-2 mt-1 justify-end">
              {site.response_time_ms != null && (
                <span className={`text-xs font-medium ${rtColor}`}>{site.response_time_ms}ms</span>
              )}
              <span className="text-portal-muted text-xs">{timeAgo}</span>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <ClientSiteDetail projectId={site.project_id} />
      )}
    </div>
  )
}

function ClientSiteDetail({ projectId }) {
  const { data, loading } = useApi(`/api/monitoring/${projectId}`)

  if (loading) return <div className="px-5 pb-5 text-portal-muted text-xs">Carregando detalhes...</div>
  if (!data) return null

  const { site, history, incidents } = data

  return (
    <div className="border-t border-portal-border px-5 pb-5 pt-4 space-y-4">
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

      {history.length > 0 && (
        <div>
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-2">Tempo de Resposta (24h)</p>
          <div className="bg-portal-bg rounded-lg p-3">
            <svg viewBox={`0 0 ${Math.min(history.length, 100)} 80`} className="w-full h-20" preserveAspectRatio="none">
              {(() => {
                const step = Math.max(1, Math.floor(history.length / 100))
                const sampled = history.filter((_, i) => i % step === 0)
                const maxMs = Math.max(...sampled.map((h) => h.response_time_ms))
                return (
                  <polyline
                    fill="none"
                    stroke="#D5851E"
                    strokeWidth="1.5"
                    points={sampled.map((h, i) => `${i},${80 - (h.response_time_ms / maxMs) * 70}`).join(' ')}
                  />
                )
              })()}
            </svg>
          </div>
        </div>
      )}

      {incidents.length > 0 && (
        <div>
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-2">Incidentes Recentes</p>
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

function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date) / 1000)
  if (seconds < 60) return 'agora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `há ${hours}h`
}
