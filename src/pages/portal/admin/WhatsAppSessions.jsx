import { useState } from 'react'
import { useApi, apiFetch } from '../../../hooks/useApi.js'

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

const fmtPhone = (p) => {
  if (!p) return '—'
  const s = String(p)
  if (s.length === 13) return `(${s.slice(2, 4)}) ${s.slice(4, 9)}-${s.slice(9)}`
  if (s.length === 12) return `(${s.slice(2, 4)}) ${s.slice(4, 8)}-${s.slice(8)}`
  return p
}

function statusOf(s) {
  if (s.revoked) return { label: 'Revogada', color: 'bg-danger/15 text-danger' }
  if (!s.verified) return { label: 'Pendente', color: 'bg-warning/15 text-warning' }
  if (s.session_expires_at && new Date(s.session_expires_at) < new Date()) {
    return { label: 'Expirada', color: 'bg-portal-border/50 text-portal-muted' }
  }
  return { label: 'Ativa', color: 'bg-success/15 text-success' }
}

export default function WhatsAppSessions() {
  const { data, loading, refetch } = useApi('/api/whatsapp/auth-sessions')
  const { data: logData, refetch: refetchLog } = useApi('/api/whatsapp/action-log?limit=30')
  const [filter, setFilter] = useState('all')
  const [acting, setActing] = useState(null)

  const sessions = data?.sessions || []
  const logs = logData?.logs || []

  const filtered = sessions.filter(s => {
    const st = statusOf(s).label.toLowerCase()
    if (filter === 'all') return true
    if (filter === 'active') return st === 'ativa'
    if (filter === 'revoked') return st === 'revogada'
    if (filter === 'pending') return st === 'pendente'
    return true
  })

  async function doAction(phone, action) {
    const confirmMsg = action === 'revoke' ? 'Revogar sessão deste número?' :
                       action === 'unrevoke' ? 'Reativar esta sessão?' :
                       'Deletar sessão permanentemente?'
    if (!confirm(confirmMsg)) return
    setActing(phone + action)
    try {
      const method = action === 'delete' ? 'DELETE' : 'POST'
      const url = action === 'delete'
        ? `/api/whatsapp/auth-sessions/${phone}`
        : `/api/whatsapp/auth-sessions/${phone}/${action}`
      await apiFetch(url, { method })
      refetch()
      refetchLog()
    } catch (err) {
      alert('Erro: ' + err.message)
    } finally {
      setActing(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">Sessões WhatsApp (Agente Cadu)</h1>
          <p className="text-portal-muted text-sm mt-1">Gerencie as sessões autenticadas do agente via WhatsApp</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Total" value={sessions.length} color="text-portal-text" />
        <SummaryCard label="Ativas" value={sessions.filter(s => statusOf(s).label === 'Ativa').length} color="text-success" />
        <SummaryCard label="Revogadas" value={sessions.filter(s => s.revoked).length} color="text-danger" />
        <SummaryCard label="Pendentes" value={sessions.filter(s => !s.verified && !s.revoked).length} color="text-warning" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'active', 'revoked', 'pending'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f ? 'bg-copper text-stone-950' : 'bg-portal-surface border border-portal-border text-portal-muted hover:text-portal-text'
            }`}
          >
            {f === 'all' ? 'Todas' : f === 'active' ? 'Ativas' : f === 'revoked' ? 'Revogadas' : 'Pendentes'}
          </button>
        ))}
      </div>

      {/* Sessions Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-portal-surface border border-portal-border rounded-xl p-8 text-center">
          <p className="text-portal-muted text-sm">Nenhuma sessão</p>
        </div>
      ) : (
        <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-portal-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Telefone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Tenant</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden lg:table-cell">Último uso</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-portal-border">
                {filtered.map(s => {
                  const st = statusOf(s)
                  return (
                    <tr key={s.phone} className="hover:bg-portal-border/10">
                      <td className="px-4 py-3 text-portal-text text-sm font-mono">{fmtPhone(s.phone)}</td>
                      <td className="px-4 py-3 text-portal-text text-sm hidden md:table-cell">{s.user_name || '—'}</td>
                      <td className="px-4 py-3 text-portal-text text-sm hidden md:table-cell">{s.tenant_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-portal-muted text-xs hidden lg:table-cell">{fmtDate(s.last_used_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {s.verified && !s.revoked && (
                            <button
                              onClick={() => doAction(s.phone, 'revoke')}
                              disabled={acting === s.phone + 'revoke'}
                              className="text-warning text-xs font-medium hover:text-warning/80 disabled:opacity-50"
                            >Revogar</button>
                          )}
                          {s.revoked && s.cadu_user_id && (
                            <button
                              onClick={() => doAction(s.phone, 'unrevoke')}
                              disabled={acting === s.phone + 'unrevoke'}
                              className="text-success text-xs font-medium hover:text-success/80 disabled:opacity-50"
                            >Reativar</button>
                          )}
                          <button
                            onClick={() => doAction(s.phone, 'delete')}
                            disabled={acting === s.phone + 'delete'}
                            className="text-danger text-xs font-medium hover:text-danger/80 disabled:opacity-50"
                          >Deletar</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action log */}
      <h2 className="text-lg font-bold text-portal-text mb-3">Log de ações do agente</h2>
      <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-portal-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-portal-muted uppercase">Quando</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-portal-muted uppercase">Telefone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-portal-muted uppercase">Ação</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-portal-muted uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-portal-muted uppercase hidden md:table-cell">Erro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border">
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-portal-muted text-sm">Sem ações registradas</td></tr>
              ) : logs.map((l, i) => (
                <tr key={i} className="hover:bg-portal-border/10">
                  <td className="px-4 py-2 text-portal-muted text-xs">{fmtDate(l.created_at)}</td>
                  <td className="px-4 py-2 text-portal-text text-xs font-mono">{l.phone}</td>
                  <td className="px-4 py-2 text-portal-text text-xs">{l.action}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${l.success ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                      {l.success ? 'OK' : 'Falha'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-portal-muted text-xs hidden md:table-cell truncate max-w-xs">{l.error_message || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="bg-portal-surface border border-portal-border rounded-xl p-4">
      <p className="text-portal-muted text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
