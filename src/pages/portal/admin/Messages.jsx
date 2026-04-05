import { useState, useEffect, useRef } from 'react'
import { useApi, apiFetch } from '../../../hooks/useApi.js'

const fmtTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function Messages() {
  const { data: convData, loading, refetch: refetchConversations } = useApi('/api/whatsapp/conversations')
  const { data: instData } = useApi('/api/whatsapp/instances')
  const [selectedJid, setSelectedJid] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const messagesEndRef = useRef(null)

  const conversations = convData?.conversations || []
  const instances = instData?.instances || []

  const filtered = search
    ? conversations.filter(c =>
        c.remote_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.remote_phone?.includes(search)
      )
    : conversations

  const selectedConv = conversations.find(c => c.remote_jid === selectedJid)

  async function loadMessages(jid) {
    setLoadingMsgs(true)
    try {
      const data = await apiFetch(`/api/whatsapp/messages/${encodeURIComponent(jid)}`)
      setMessages(data.messages || [])
      refetchConversations()
    } catch { setMessages([]) }
    finally { setLoadingMsgs(false) }
  }

  function selectConversation(conv) {
    setSelectedJid(conv.remote_jid)
    loadMessages(conv.remote_jid)
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Auto-refresh conversas a cada 30s
  useEffect(() => {
    const interval = setInterval(() => {
      refetchConversations()
      if (selectedJid) loadMessages(selectedJid)
    }, 30000)
    return () => clearInterval(interval)
  }, [selectedJid])

  async function handleSend(e) {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConv) return
    setSending(true)
    try {
      await apiFetch('/api/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({
          instance: selectedConv.instance,
          phone: selectedConv.remote_phone,
          message: newMessage.trim(),
        }),
      })
      setNewMessage('')
      loadMessages(selectedJid)
    } catch (err) {
      alert('Erro ao enviar: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">Mensagens</h1>
          <div className="flex items-center gap-3 mt-1">
            {instances.map(inst => (
              <span key={inst.name} className="flex items-center gap-1.5 text-xs text-portal-muted">
                <span className={`w-2 h-2 rounded-full ${inst.status === 'open' ? 'bg-success' : 'bg-danger'}`} />
                {inst.profileName || inst.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 bg-portal-surface border border-portal-border rounded-xl overflow-hidden min-h-0">
        {/* Sidebar - conversas */}
        <div className="w-80 border-r border-portal-border flex flex-col shrink-0">
          <div className="p-3 border-b border-portal-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversa..."
              className="w-full bg-portal-bg border border-portal-border rounded-lg px-3 py-2 text-sm text-portal-text placeholder:text-portal-muted focus:outline-none focus:border-copper"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-copper border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-portal-muted text-sm text-center py-8">Nenhuma conversa</p>
            ) : (
              filtered.map(conv => (
                <button
                  key={conv.remote_jid}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left px-4 py-3 border-b border-portal-border hover:bg-portal-border/10 transition-colors ${
                    selectedJid === conv.remote_jid ? 'bg-copper/10 border-l-2 border-l-copper' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-portal-text text-sm font-medium truncate">
                        {conv.remote_name || conv.remote_phone}
                      </p>
                      <p className="text-portal-muted text-xs truncate">
                        {conv.remote_phone}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-portal-muted text-xs">{fmtTime(conv.last_message_at)}</span>
                      {conv.unread_count > 0 && (
                        <span className="bg-copper text-stone-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-portal-muted text-xs mt-0.5 truncate">
                    {conv.instance === 'principal' ? 'Forge' : conv.instance}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedJid ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-portal-muted text-sm">Selecione uma conversa</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-portal-border flex items-center justify-between">
                <div>
                  <p className="text-portal-text font-semibold text-sm">
                    {selectedConv?.remote_name || selectedConv?.remote_phone}
                  </p>
                  <p className="text-portal-muted text-xs">{selectedConv?.remote_phone} — {selectedConv?.instance}</p>
                </div>
                <a
                  href={`https://wa.me/${selectedConv?.remote_phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-copper text-xs font-medium hover:text-copper-dark"
                >
                  Abrir no WhatsApp →
                </a>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loadingMsgs ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-copper border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-portal-muted text-sm text-center py-8">Nenhuma mensagem</p>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                          msg.direction === 'outgoing'
                            ? 'bg-copper/15 text-portal-text'
                            : 'bg-portal-bg text-portal-text border border-portal-border'
                        }`}
                      >
                        {msg.body && <p className="whitespace-pre-wrap break-words">{msg.body}</p>}
                        {msg.message_type !== 'text' && !msg.body && (
                          <p className="italic text-portal-muted">[{msg.message_type}]</p>
                        )}
                        <p className={`text-xs mt-1 ${msg.direction === 'outgoing' ? 'text-copper/60' : 'text-portal-muted'}`}>
                          {fmtTime(msg.wa_timestamp || msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send */}
              <form onSubmit={handleSend} className="p-3 border-t border-portal-border flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite uma mensagem..."
                  className="flex-1 bg-portal-bg border border-portal-border rounded-lg px-4 py-2.5 text-sm text-portal-text placeholder:text-portal-muted focus:outline-none focus:border-copper"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {sending ? '...' : 'Enviar'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
