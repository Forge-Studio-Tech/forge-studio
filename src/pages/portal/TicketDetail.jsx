import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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

const PRIORITY_LABELS = { low: 'Baixa', normal: 'Normal', high: 'Alta', urgent: 'Urgente' }

export default function TicketDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { data, loading, refetch } = useApi(`/api/tickets/${id}`)
  const [body, setBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)

  const ticket = data?.ticket
  const messages = data?.messages || []

  const formatDateTime = (d) => d ? new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  }) : '—'

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    try {
      await apiFetch(`/api/tickets/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body, is_internal: isInternal }),
      })
      setBody('')
      setIsInternal(false)
      refetch()
    } catch (err) {
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  const changeStatus = async (status) => {
    try {
      await apiFetch(`/api/tickets/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      refetch()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <p className="text-portal-muted">Carregando...</p>
  if (!ticket) return <p className="text-red-400">Ticket não encontrado.</p>

  const isClosed = ['resolved', 'closed'].includes(ticket.status)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/portal/tickets" className="text-copper hover:text-copper-dark text-sm mb-2 inline-block">
          ← Voltar
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-portal-text">{ticket.subject}</h1>
            <p className="text-sm text-portal-muted mt-1">
              {isAdmin && <span>{ticket.user_name} · </span>}
              {ticket.project_name && <span>{ticket.project_name} · </span>}
              {PRIORITY_LABELS[ticket.priority]} · Aberto em {formatDateTime(ticket.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
              {STATUS_LABELS[ticket.status]}
            </span>
            {isAdmin && !isClosed && (
              <select
                value={ticket.status}
                onChange={(e) => changeStatus(e.target.value)}
                className="bg-portal-bg border border-portal-border rounded-lg px-2 py-1 text-portal-text text-xs h-[30px]"
              >
                <option value="open">Aberto</option>
                <option value="in_progress">Em andamento</option>
                <option value="waiting_client">Aguardando cliente</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4 mb-6">
        {messages.map((msg) => {
          const isOwn = msg.user_id === user.id
          const isAdminMsg = msg.user_role === 'admin'

          return (
            <div
              key={msg.id}
              className={`p-4 rounded-xl border ${
                msg.is_internal
                  ? 'bg-yellow-500/5 border-yellow-500/20'
                  : isAdminMsg
                  ? 'bg-copper/5 border-copper/20'
                  : 'bg-portal-surface border-portal-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isAdminMsg ? 'text-copper' : 'text-portal-text'}`}>
                    {msg.user_name}
                  </span>
                  {msg.is_internal && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                      nota interna
                    </span>
                  )}
                </div>
                <span className="text-xs text-portal-muted">{formatDateTime(msg.created_at)}</span>
              </div>
              <p className="text-portal-text text-sm whitespace-pre-wrap">{msg.body}</p>
            </div>
          )
        })}
      </div>

      {/* Reply */}
      {!isClosed && (
        <form onSubmit={sendMessage} className="bg-portal-surface border border-portal-border rounded-xl p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Escreva sua resposta..."
            className="w-full bg-portal-bg border border-portal-border rounded-lg px-3 py-2 text-portal-text text-sm resize-none mb-3"
            required
          />
          <div className="flex items-center justify-between">
            <div>
              {isAdmin && (
                <label className="flex items-center gap-2 text-sm text-portal-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-portal-border"
                  />
                  Nota interna (invisível para o cliente)
                </label>
              )}
            </div>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 bg-copper text-white rounded-lg hover:bg-copper-dark transition text-sm disabled:opacity-50"
            >
              {sending ? 'Enviando...' : 'Responder'}
            </button>
          </div>
        </form>
      )}

      {isClosed && (
        <div className="bg-portal-surface border border-portal-border rounded-xl p-4 text-center text-portal-muted text-sm">
          Este ticket foi {STATUS_LABELS[ticket.status].toLowerCase()}.
          {isAdmin && (
            <button onClick={() => changeStatus('open')} className="text-copper hover:underline ml-2">
              Reabrir
            </button>
          )}
        </div>
      )}
    </div>
  )
}
