import { useState, useEffect } from 'react'
import { useApi, apiFetch } from '../../hooks/useApi.js'

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
              onRefresh={async (e) => {
                e.stopPropagation()
                await apiFetch(`/api/analytics?refresh=true`)
                refetch()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ClientSiteCard({ site, isExpanded, onToggle, onRefresh }) {
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
            <RefreshBtn onClick={onRefresh} />
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

const SOURCE_LABELS = {
  'Organic Search': 'Busca Orgânica', 'Direct': 'Acesso Direto', 'Referral': 'Indicação',
  'Organic Social': 'Redes Sociais', 'Paid Search': 'Busca Paga', 'Paid Social': 'Social Pago',
  'Email': 'Email', 'Display': 'Display', 'Unassigned': 'Não identificado',
  'Organic Video': 'Vídeo Orgânico', 'Paid Video': 'Vídeo Pago', 'Cross-network': 'Cross-network',
}
const DEVICE_LABELS = { desktop: 'Computador', mobile: 'Celular', tablet: 'Tablet' }
const COUNTRY_LABELS = { Brazil: 'Brasil', 'United States': 'Estados Unidos', Portugal: 'Portugal', Argentina: 'Argentina' }

function AnalyticsDetail({ projectId }) {
  const [period, setPeriod] = useState('7d')
  const { data, loading } = useApi(`/api/analytics/${projectId}?period=${period}`)

  if (loading) return <div className="px-5 pb-5 text-portal-muted text-xs">Carregando detalhes...</div>
  if (!data) return null

  const { visitors_by_day, sources, devices, engagement, locations, scroll_depth } = data

  return (
    <div className="border-t border-portal-border px-5 pb-5 pt-4 space-y-5">
      <div className="flex gap-1">
        {['7d', '30d', '90d'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              period === p ? 'bg-copper text-white' : 'bg-portal-bg text-portal-muted hover:text-portal-text'
            }`}
          >
            {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Visitantes" value={visitors_by_day.reduce((s, d) => s + d.visitors, 0)} tooltip="Pessoas únicas que acessaram o site no período" />
        <MiniStat label="Sessões" value={visitors_by_day.reduce((s, d) => s + d.sessions, 0)} tooltip="Total de visitas (uma pessoa pode gerar várias sessões)" />
        <MiniStat label="Saíram rápido" value={`${engagement.bounce_rate}%`} tooltip="Visitantes que saíram sem interagir com o site (clicar, rolar, navegar)" />
        <MiniStat label="Tempo Médio" value={formatDuration(engagement.avg_session_duration)} tooltip="Tempo médio que cada visitante permaneceu no site" />
      </div>

      {visitors_by_day.length > 1 && (
        <div>
          <SectionTitle label="Visitantes por Dia" tooltip="Evolução diária de visitantes únicos no período selecionado" />
          <div className="bg-portal-bg rounded-lg p-3">
            <svg viewBox="0 0 600 80" className="w-full h-20" preserveAspectRatio="none">
              {(() => {
                const maxV = Math.max(...visitors_by_day.map((d) => d.visitors))
                return (
                  <polyline fill="none" stroke="#E8861B" strokeWidth="1.5" vectorEffect="non-scaling-stroke"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sources.length > 0 && (
          <div>
            <SectionTitle label="Fontes de Tráfego" tooltip="De onde vieram os visitantes: busca no Google, acesso direto, redes sociais, etc." />
            <div className="space-y-2">
              {sources.map((s) => (
                <BarRow key={s.source} label={SOURCE_LABELS[s.source] || s.source} value={s.sessions} percentage={s.percentage} />
              ))}
            </div>
          </div>
        )}

        {devices.length > 0 && (
          <div>
            <SectionTitle label="Dispositivos" tooltip="Tipo de aparelho usado para acessar o site" />
            <div className="space-y-2">
              {devices.map((d) => (
                <BarRow key={d.device} label={DEVICE_LABELS[d.device] || d.device} value={d.sessions} percentage={d.percentage} />
              ))}
            </div>
          </div>
        )}
      </div>

      {locations?.length > 0 && (
        <div>
          <SectionTitle label="Localização" tooltip="Cidades de onde os visitantes acessaram o site" />
          <div className="space-y-2">
            {locations.map((l) => (
              <BarRow
                key={`${l.city}-${l.country}`}
                label={`${l.city === '(not set)' ? 'Não identificado' : l.city}, ${COUNTRY_LABELS[l.country] || l.country}`}
                value={l.users}
                percentage={l.percentage}
                color="bg-success/20"
              />
            ))}
          </div>
        </div>
      )}

      {scroll_depth.length > 0 && (
        <div>
          <SectionTitle label="Scroll por Seção" tooltip="Quantos visitantes viram cada seção do site ao rolar a página" />
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

function Tooltip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex ml-1">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShow(!show) }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-portal-muted hover:text-copper transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01" />
        </svg>
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-stone-800 text-stone-200 text-[11px] rounded-lg z-50 shadow-lg w-max max-w-[250px] text-center leading-tight">
          {text}
        </span>
      )}
    </span>
  )
}

function SectionTitle({ label, tooltip }) {
  return (
    <div className="flex items-center mb-2">
      <p className="text-portal-muted text-[10px] uppercase tracking-wider">{label}</p>
      {tooltip && <Tooltip text={tooltip} />}
    </div>
  )
}

function MiniStat({ label, value, tooltip }) {
  return (
    <div className="bg-portal-bg rounded-lg p-3">
      <div className="flex items-center mb-0.5">
        <p className="text-portal-muted text-[10px] uppercase tracking-wider">{label}</p>
        {tooltip && <Tooltip text={tooltip} />}
      </div>
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

function RefreshBtn({ onClick }) {
  const [spinning, setSpinning] = useState(false)
  return (
    <button
      title="Atualizar dados"
      onClick={async (e) => {
        setSpinning(true)
        await onClick(e)
        setTimeout(() => setSpinning(false), 600)
      }}
      className="text-portal-muted hover:text-copper transition-colors p-1"
    >
      <svg className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
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
