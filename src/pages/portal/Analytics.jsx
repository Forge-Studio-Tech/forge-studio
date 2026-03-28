import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi.js'

export default function ClientAnalytics() {
  const { data, loading, error, refetch } = useApi('/api/analytics')
  const sites = data?.sites || []
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    const interval = setInterval(refetch, 6 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refetch])

  return (
    <div>
      <h1 className="text-2xl font-bold text-portal-text mb-1">Analytics</h1>
      <p className="text-portal-muted text-sm mb-8">Tráfego e comportamento do seu site</p>

      {loading ? (
        <p className="text-portal-muted text-sm">Carregando...</p>
      ) : error ? (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4">
          <p className="text-danger text-sm">{error}</p>
        </div>
      ) : sites.length === 0 ? (
        <div className="bg-portal-surface border border-portal-border rounded-xl p-8 text-center">
          <p className="text-portal-muted text-sm">Analytics não disponível para o seu plano.</p>
          <p className="text-portal-muted text-xs mt-2">Entre em contato para upgrade.</p>
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
  const trendColor = site.trend > 0 ? 'text-success' : site.trend < 0 ? 'text-danger' : 'text-portal-muted'
  const trendIcon = site.trend > 0 ? '↑' : site.trend < 0 ? '↓' : '—'

  return (
    <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-portal-border/10 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-4">
            {site.visitors_7d != null ? (
              <>
                <div className="text-right">
                  <p className="text-portal-text font-bold text-lg">{site.visitors_7d}</p>
                  <p className="text-portal-muted text-[10px] uppercase">visitantes</p>
                </div>
                <span className={`text-xs font-medium ${trendColor}`}>
                  {trendIcon} {Math.abs(site.trend)}%
                </span>
              </>
            ) : (
              <span className="text-portal-muted text-xs">Sem dados</span>
            )}
            <svg className={`w-4 h-4 text-portal-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {isExpanded && <AnalyticsDetail projectId={site.project_id} />}
    </div>
  )
}

function AnalyticsDetail({ projectId }) {
  const [period, setPeriod] = useState('7d')
  const { data, loading } = useApi(`/api/analytics/${projectId}?period=${period}`)

  if (loading) return <div className="px-5 pb-5 text-portal-muted text-xs">Carregando detalhes...</div>
  if (!data) return null

  const { visitors_by_day, sources, devices, engagement, scroll_depth } = data

  return (
    <div className="border-t border-portal-border px-5 pb-5 pt-4 space-y-5">
      {/* Seletor de período */}
      <div className="flex gap-1">
        {['7d', '30d', '90d'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              period === p
                ? 'bg-copper text-white'
                : 'bg-portal-bg text-portal-muted hover:text-portal-text'
            }`}
          >
            {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
          </button>
        ))}
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Visitantes" value={visitors_by_day.reduce((s, d) => s + d.visitors, 0)} />
        <MiniStat label="Sessões" value={visitors_by_day.reduce((s, d) => s + d.sessions, 0)} />
        <MiniStat label="Bounce Rate" value={`${engagement.bounce_rate}%`} />
        <MiniStat label="Tempo Médio" value={formatDuration(engagement.avg_session_duration)} />
      </div>

      {/* Gráfico visitantes por dia */}
      {visitors_by_day.length > 1 && (
        <div>
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-2">Visitantes por Dia</p>
          <div className="bg-portal-bg rounded-lg p-3">
            <svg viewBox="0 0 600 80" className="w-full h-20" preserveAspectRatio="none">
              {(() => {
                const maxV = Math.max(...visitors_by_day.map((d) => d.visitors))
                return (
                  <polyline
                    fill="none"
                    stroke="#D5851E"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                    points={visitors_by_day.map((d, i) => `${(i / (visitors_by_day.length - 1)) * 600},${76 - (d.visitors / maxV) * 68}`).join(' ')}
                  />
                )
              })()}
            </svg>
            <div className="flex justify-between text-[10px] text-portal-muted mt-1">
              <span>{formatDate(visitors_by_day[0]?.date)}</span>
              <span>{formatDate(visitors_by_day[visitors_by_day.length - 1]?.date)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Fontes + Dispositivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sources.length > 0 && (
          <div>
            <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-2">Fontes de Tráfego</p>
            <div className="space-y-2">
              {sources.map((s) => (
                <BarRow key={s.source} label={s.source} value={s.sessions} percentage={s.percentage} />
              ))}
            </div>
          </div>
        )}

        {devices.length > 0 && (
          <div>
            <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-2">Dispositivos</p>
            <div className="space-y-2">
              {devices.map((d) => (
                <BarRow key={d.device} label={d.device} value={d.sessions} percentage={d.percentage} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scroll depth */}
      {scroll_depth.length > 0 && (
        <div>
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-2">Scroll por Seção</p>
          <div className="space-y-2">
            {scroll_depth.map((s) => (
              <BarRow key={s.section} label={s.section} value={s.views} percentage={s.percentage} color="bg-copper/30" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-portal-bg rounded-lg p-3">
      <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-lg font-bold text-portal-text">{value}</p>
    </div>
  )
}

function BarRow({ label, value, percentage, color = 'bg-copper/20' }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-portal-text capitalize">{label}</span>
        <span className="text-portal-muted">{value} ({percentage}%)</span>
      </div>
      <div className="h-1.5 bg-portal-border/30 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}m ${sec}s`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
