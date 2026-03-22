import { useApi } from '../../../hooks/useApi'
import StatCard from '../../../components/portal/StatCard'

function formatBRL(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatMonth(m) {
  const [y, mo] = m.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[Number(mo) - 1]}/${y.slice(2)}`
}

function MiniBar({ value, max }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full bg-portal-border/30 rounded-full h-2">
      <div className="bg-copper rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function DashboardMRR() {
  const { data: mrrData, loading: loadingMrr } = useApi('/api/dashboard/mrr')
  const { data: alertsData, loading: loadingAlerts } = useApi('/api/dashboard/alerts')
  const { data: overviewData } = useApi('/api/dashboard/overview')

  const mrr = mrrData || { current_mrr: 0, active_plans: 0, by_type: [], by_client: [], trend: [] }
  const alerts = alertsData || { overdue: [], upcoming: [], summary: {}, repeat_offenders: [] }
  const overview = overviewData?.overview || {}

  const loading = loadingMrr || loadingAlerts

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'

  const maxClientMrr = Math.max(...(mrr.by_client || []).map((c) => Number(c.mrr)), 1)
  const maxTrend = Math.max(...(mrr.trend || []).map((t) => Number(t.received)), 1)

  return (
    <div>
      <h1 className="text-2xl font-bold text-portal-text mb-6">Dashboard Financeiro</h1>

      {loading ? (
        <p className="text-portal-muted">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {/* Overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="MRR Atual" value={formatBRL(mrr.current_mrr)} accent />
            <StatCard label="Planos Ativos" value={mrr.active_plans} />
            <StatCard label="Clientes Ativos" value={overview.active_clients || 0} />
            <StatCard label="Tickets Abertos" value={overview.open_tickets || 0} />
          </div>

          {/* Alertas */}
          {(alerts.summary.overdue_count > 0 || alerts.summary.upcoming_count > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.summary.overdue_count > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <h3 className="text-red-400 font-semibold text-sm mb-3">
                    Inadimplentes ({alerts.summary.overdue_count})
                  </h3>
                  <div className="space-y-2">
                    {alerts.overdue.map((p) => (
                      <div key={p.id} className="flex justify-between text-sm">
                        <span className="text-portal-text">{p.company_name}</span>
                        <span className="text-red-400">{formatBRL(p.amount)} · {p.days_overdue}d atraso</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-red-400/70 mt-2">Total: {formatBRL(alerts.summary.overdue_total)}</p>
                </div>
              )}

              {alerts.summary.upcoming_count > 0 && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                  <h3 className="text-yellow-400 font-semibold text-sm mb-3">
                    Vencendo em 7 dias ({alerts.summary.upcoming_count})
                  </h3>
                  <div className="space-y-2">
                    {alerts.upcoming.map((p) => (
                      <div key={p.id} className="flex justify-between text-sm">
                        <span className="text-portal-text">{p.company_name}</span>
                        <span className="text-yellow-400">{formatBRL(p.amount)} · {formatDate(p.due_date)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-400/70 mt-2">Total: {formatBRL(alerts.summary.upcoming_total)}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tendência de receita */}
            <div className="bg-portal-surface border border-portal-border rounded-xl p-4">
              <h3 className="text-portal-text font-semibold text-sm mb-4">Receita Recebida (6 meses)</h3>
              {mrr.trend.length === 0 ? (
                <p className="text-portal-muted text-sm">Sem dados ainda.</p>
              ) : (
                <div className="space-y-3">
                  {mrr.trend.map((t) => (
                    <div key={t.month}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-portal-muted">{formatMonth(t.month)}</span>
                        <span className="text-portal-text">{formatBRL(t.received)}</span>
                      </div>
                      <MiniBar value={Number(t.received)} max={maxTrend} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MRR por cliente */}
            <div className="bg-portal-surface border border-portal-border rounded-xl p-4">
              <h3 className="text-portal-text font-semibold text-sm mb-4">MRR por Cliente</h3>
              {mrr.by_client.length === 0 ? (
                <p className="text-portal-muted text-sm">Nenhum plano ativo.</p>
              ) : (
                <div className="space-y-3">
                  {mrr.by_client.map((c) => (
                    <div key={c.client_id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-portal-muted">{c.company_name}</span>
                        <span className="text-copper">{formatBRL(c.mrr)}</span>
                      </div>
                      <MiniBar value={Number(c.mrr)} max={maxClientMrr} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reincidentes */}
          {alerts.repeat_offenders.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <h3 className="text-red-400 font-semibold text-sm mb-3">Reincidentes (2+ pagamentos atrasados)</h3>
              <div className="space-y-2">
                {alerts.repeat_offenders.map((r) => (
                  <div key={r.client_id} className="flex justify-between text-sm">
                    <span className="text-portal-text">{r.company_name}</span>
                    <span className="text-red-400">{r.overdue_count} atrasados · {formatBRL(r.total_overdue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown por tipo */}
          {mrr.by_type.length > 0 && (
            <div className="bg-portal-surface border border-portal-border rounded-xl p-4">
              <h3 className="text-portal-text font-semibold text-sm mb-3">MRR por Tipo de Plano</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mrr.by_type.map((t, i) => (
                  <div key={i} className="text-center">
                    <p className="text-copper text-lg font-bold">{formatBRL(t.total)}</p>
                    <p className="text-xs text-portal-muted capitalize">{t.type} {t.tier}</p>
                    <p className="text-xs text-portal-muted">{t.count} plano(s)</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
