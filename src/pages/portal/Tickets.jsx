import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { useApi, apiFetch } from '../../hooks/useApi'

const STATUS_COLORS = {
  open: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-yellow-500/20 text-yellow-400',
  waiting_client: 'bg-orange-500/20 text-orange-400',
  resolved: 'bg-green-500/20 text-green-400',
  closed: 'bg-portal-muted/20 text-portal-muted',
}

const STATUS_LABELS = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  waiting_client: 'Aguardando cliente',
  resolved: 'Resolvido',
  closed: 'Fechado',
}

const PRIORITY_COLORS = {
  low: 'text-portal-muted',
  normal: 'text-portal-text',
  high: 'text-yellow-400',
  urgent: 'text-red-400',
}

const PRIORITY_LABELS = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
}

function NewTicketModal({ onClose, onCreated }) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState('normal')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({ subject, body, priority }),
      })
      onCreated()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-portal-surface border border-portal-border rounded-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-portal-text mb-4">Nova Solicitação</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-portal-muted mb-1">Assunto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-portal-bg border border-portal-border rounded-lg px-3 py-2 text-portal-text"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-portal-muted mb-1">Prioridade</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-portal-bg border border-portal-border rounded-lg px-3 py-2 text-portal-text h-[38px]"
            >
              <option value="low">Baixa</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-portal-muted mb-1">Mensagem</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full bg-portal-bg border border-portal-border rounded-lg px-3 py-2 text-portal-text resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-portal-muted hover:text-portal-text transition">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-copper text-white rounded-lg hover:bg-copper-dark transition disabled:opacity-50">
              {saving ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Tickets() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')
  const [showNew, setShowNew] = useState(false)

  const url = statusFilter ? `/api/tickets?status=${statusFilter}` : '/api/tickets'
  const { data, loading, refetch } = useApi(url)
  const tickets = data?.tickets || []

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-portal-text">Solicitações</h1>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-portal-surface border border-portal-border rounded-lg px-3 py-2 text-portal-text text-sm h-[38px]"
          >
            <option value="">Todos</option>
            <option value="open">Abertos</option>
            <option value="in_progress">Em andamento</option>
            <option value="waiting_client">Aguardando</option>
            <option value="resolved">Resolvidos</option>
            <option value="closed">Fechados</option>
          </select>
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2 bg-copper text-white rounded-lg hover:bg-copper-dark transition text-sm font-medium"
          >
            + Nova Solicitação
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-portal-muted">Carregando...</p>
      ) : tickets.length === 0 ? (
        <div className="bg-portal-surface border border-portal-border rounded-xl p-8 text-center">
          <p className="text-portal-muted">Nenhuma solicitação encontrada.</p>
        </div>
      ) : (
        <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-portal-border text-portal-muted uppercase tracking-wider text-xs">
                <th className="text-left p-4">Assunto</th>
                {isAdmin && <th className="text-left p-4 hidden md:table-cell">Cliente</th>}
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4 hidden md:table-cell">Prioridade</th>
                <th className="text-left p-4 hidden md:table-cell">Msgs</th>
                <th className="text-left p-4 hidden md:table-cell">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-portal-border/50 hover:bg-portal-border/10 transition cursor-pointer"
                  onClick={() => navigate(`/portal/tickets/${t.id}`)}
                >
                  <td className="p-4">
                    <span className="text-portal-text font-medium">{t.subject}</span>
                    {t.project_name && (
                      <span className="block text-xs text-portal-muted mt-0.5">{t.project_name}</span>
                    )}
                  </td>
                  {isAdmin && <td className="p-4 hidden md:table-cell text-portal-muted">{t.user_name}</td>}
                  <td className="p-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                      {STATUS_LABELS[t.status]}
                    </span>
                  </td>
                  <td className={`p-4 hidden md:table-cell text-xs font-medium ${PRIORITY_COLORS[t.priority]}`}>
                    {PRIORITY_LABELS[t.priority]}
                  </td>
                  <td className="p-4 hidden md:table-cell text-portal-muted">{t.message_count || 0}</td>
                  <td className="p-4 hidden md:table-cell text-portal-muted">{formatDate(t.last_message_at || t.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <NewTicketModal
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); refetch() }}
        />
      )}
    </div>
  )
}
