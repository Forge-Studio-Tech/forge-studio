import { useState, useEffect, useRef, useCallback } from 'react'
import { useApi, apiFetch } from '../../../hooks/useApi.js'
import { useUnreadMessages } from '../../../hooks/useUnreadMessages.js'

const fmtTime = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Som de notificação — AudioContext persistente, resumido na primeira interação
let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

// Resume AudioContext em qualquer click (requisito do browser)
if (typeof window !== 'undefined') {
  const resumeAudio = () => {
    getAudioContext()
    document.removeEventListener('click', resumeAudio)
    document.removeEventListener('touchstart', resumeAudio)
  }
  document.addEventListener('click', resumeAudio, { once: true })
  document.addEventListener('touchstart', resumeAudio, { once: true })
}

function playNotificationSound() {
  try {
    const ctx = getAudioContext()
    // Nota dupla: Lá5 → Dó6 (som curto e agradável)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch (err) {
    console.warn('Audio notification failed:', err)
  }
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

function showBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/logo-192.png',
        badge: '/logo-192.png',
        tag: 'forge-whatsapp',
        renotify: true,
      })
    } catch {
      // Notifications não suportadas neste contexto
    }
  }
}

export default function Messages() {
  const { data: convData, loading, refetch: refetchConversations } = useApi('/api/whatsapp/conversations')
  const { data: instData } = useApi('/api/whatsapp/instances')
  const [selectedJid, setSelectedJid] = useState(null)
  const [selectedInstance, setSelectedInstance] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('forge_msg_sound') !== 'off')
  const messagesEndRef = useRef(null)
  const prevUnreadRef = useRef(null)

  const { count: unreadCount } = useUnreadMessages({ enabled: true, interval: 10000 })

  const conversations = convData?.conversations || []
  const instances = instData?.instances || []

  // Som + notificação quando chegar nova mensagem (via unread count)
  useEffect(() => {
    if (prevUnreadRef.current === null) {
      prevUnreadRef.current = unreadCount
      return
    }
    if (unreadCount > prevUnreadRef.current) {
      if (soundEnabled) playNotificationSound()
      if (document.hidden) {
        showBrowserNotification('Nova mensagem WhatsApp', 'Você recebeu uma nova mensagem no Mission Control')
      }
    }
    prevUnreadRef.current = unreadCount
  }, [unreadCount, soundEnabled])

  // Som quando chegar nova mensagem na conversa aberta (last_message_at muda)
  const lastMsgTimestamp = useRef(null)
  useEffect(() => {
    if (!conversations.length) return
    const newest = conversations.reduce((max, c) => {
      const t = new Date(c.last_message_at).getTime()
      return t > max ? t : max
    }, 0)
    if (lastMsgTimestamp.current !== null && newest > lastMsgTimestamp.current) {
      if (soundEnabled) playNotificationSound()
    }
    lastMsgTimestamp.current = newest
  }, [conversations, soundEnabled])

  // Pedir permissão de notificação ao montar
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  function toggleSound() {
    const next = !soundEnabled
    setSoundEnabled(next)
    localStorage.setItem('forge_msg_sound', next ? 'on' : 'off')
    if (next) playNotificationSound() // toca som de teste ao ativar
  }

  const filtered = search
    ? conversations.filter(c =>
        c.remote_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.remote_phone?.includes(search)
      )
    : conversations

  const selectedConv = conversations.find(c => c.remote_jid === selectedJid && c.instance === selectedInstance)

  const loadMessages = useCallback(async (jid, instance) => {
    setLoadingMsgs(true)
    try {
      const data = await apiFetch(`/api/whatsapp/messages/${encodeURIComponent(jid)}?instance=${encodeURIComponent(instance)}`)
      setMessages(data.messages || [])
      refetchConversations()
    } catch { setMessages([]) }
    finally { setLoadingMsgs(false) }
  }, [refetchConversations])

  function selectConversation(conv) {
    setSelectedJid(conv.remote_jid)
    setSelectedInstance(conv.instance)
    loadMessages(conv.remote_jid, conv.instance)
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Auto-refresh conversas a cada 15s (mais frequente pra detectar novas mensagens)
  useEffect(() => {
    const interval = setInterval(() => {
      refetchConversations()
      if (selectedJid && selectedInstance) loadMessages(selectedJid, selectedInstance)
    }, 15000)
    return () => clearInterval(interval)
  }, [selectedJid, selectedInstance, loadMessages, refetchConversations])

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
      loadMessages(selectedJid, selectedInstance)
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
        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Desativar som de notificação' : 'Ativar som de notificação'}
          className={`p-2 rounded-lg transition-colors ${
            soundEnabled
              ? 'text-copper hover:bg-copper/10'
              : 'text-portal-muted hover:bg-portal-border/30'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {soundEnabled ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            )}
          </svg>
        </button>
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
                  key={`${conv.instance}:${conv.remote_jid}`}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left px-4 py-3 border-b border-portal-border hover:bg-portal-border/10 transition-colors ${
                    selectedJid === conv.remote_jid && selectedInstance === conv.instance ? 'bg-copper/10 border-l-2 border-l-copper' : ''
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
