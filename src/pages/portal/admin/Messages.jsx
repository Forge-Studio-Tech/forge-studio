import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { useApi, apiFetch } from '../../../hooks/useApi.js'
import { useUnreadMessages } from '../../../hooks/useUnreadMessages.js'

const API_BASE = import.meta.env.VITE_API_URL || ''

// Componente de mídia que baixa via fetch (cookie auth) e usa blob URL
const MediaAttachment = memo(function MediaAttachment({ msgId, type }) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (url || loading) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/whatsapp/messages/${msgId}/media`, { credentials: 'include' })
      if (!res.ok) throw new Error('falha')
      const blob = await res.blob()
      setUrl(URL.createObjectURL(blob))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [msgId, url, loading])

  useEffect(() => { return () => { if (url) URL.revokeObjectURL(url) } }, [url])

  if (error) return <p className="italic text-danger text-xs">falha ao carregar mídia</p>

  if (type === 'audio') {
    if (!url) return <button onClick={load} disabled={loading} className="text-copper text-xs underline">{loading ? 'Carregando...' : '▶ Tocar áudio'}</button>
    return <audio controls src={url} className="max-w-full" />
  }
  if (type === 'image') {
    if (!url && !loading) { load() }
    if (!url) return <div className="w-40 h-40 bg-portal-border/20 rounded animate-pulse" />
    return <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="" className="max-w-full rounded" /></a>
  }
  if (type === 'video') {
    if (!url) return <button onClick={load} disabled={loading} className="text-copper text-xs underline">{loading ? 'Carregando...' : '▶ Carregar vídeo'}</button>
    return <video controls src={url} className="max-w-full rounded" />
  }
  if (type === 'document') {
    if (!url) return <button onClick={load} disabled={loading} className="text-copper text-xs underline">{loading ? 'Carregando...' : '📎 Baixar documento'}</button>
    return <a href={url} download className="text-copper underline">📎 Salvar documento</a>
  }
  return null
})

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
  const [showContactPanel, setShowContactPanel] = useState(false)
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
                  <div className="flex items-start gap-2">
                    {conv.profile_pic_url ? (
                      <img src={conv.profile_pic_url} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover mt-0.5" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-portal-border/30 flex items-center justify-center text-sm shrink-0 mt-0.5">💬</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-portal-text text-sm font-medium truncate">
                        {conv.custom_name || conv.remote_name || conv.remote_phone}
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
              <div className="px-4 py-3 border-b border-portal-border flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowContactPanel(true)}
                  className="flex items-center gap-3 min-w-0 flex-1 hover:bg-portal-border/10 -mx-2 px-2 py-1 rounded transition-colors"
                  title="Ver detalhes do contato"
                >
                  {selectedConv?.profile_pic_url ? (
                    <img src={selectedConv.profile_pic_url} alt="" className="w-10 h-10 rounded-full shrink-0 object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-portal-border/30 flex items-center justify-center text-lg shrink-0">💬</div>
                  )}
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-portal-text font-semibold text-sm truncate">
                      {selectedConv?.custom_name || selectedConv?.remote_name || selectedConv?.remote_phone}
                    </p>
                    <p className="text-portal-muted text-xs truncate">{selectedConv?.remote_phone} — {selectedConv?.instance}</p>
                  </div>
                </button>
                <a
                  href={`https://wa.me/${selectedConv?.remote_phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-copper text-xs font-medium hover:text-copper-dark shrink-0"
                >
                  WhatsApp →
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
                        {msg.message_type !== 'text' && <MediaAttachment msgId={msg.id} type={msg.message_type} />}
                        {msg.body && msg.message_type === 'text' && <p className="whitespace-pre-wrap break-words">{msg.body}</p>}
                        {msg.body && msg.message_type !== 'text' && msg.body !== '[audio]' && (
                          <p className="whitespace-pre-wrap break-words mt-1">{msg.body}</p>
                        )}
                        {msg.transcription && (
                          <p className="text-xs italic text-portal-muted mt-1 border-l-2 border-copper/50 pl-2">
                            📝 {msg.transcription}
                          </p>
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
              <form onSubmit={handleSend} className="p-3 border-t border-portal-border flex gap-2 items-center">
                <AudioRecorder
                  onSend={async (base64) => {
                    try {
                      await apiFetch('/api/whatsapp/send-audio', {
                        method: 'POST',
                        body: JSON.stringify({
                          instance: selectedConv.instance,
                          phone: selectedConv.remote_phone,
                          audio_base64: base64,
                        }),
                      })
                      loadMessages(selectedJid, selectedInstance)
                    } catch (err) {
                      alert('Erro ao enviar audio: ' + err.message)
                    }
                  }}
                />
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

      {showContactPanel && selectedConv && (
        <ContactPanel
          conv={selectedConv}
          onClose={() => setShowContactPanel(false)}
          onSaved={() => { refetchConversations(); setShowContactPanel(false) }}
        />
      )}
    </div>
  )
}

function ContactPanel({ conv, onClose, onSaved }) {
  const [name, setName] = useState(conv.custom_name || conv.remote_name || '')
  const [notes, setNotes] = useState(conv.notes || '')
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [profilePic, setProfilePic] = useState(conv.profile_pic_url)

  async function handleSave() {
    setSaving(true)
    try {
      await apiFetch(`/api/whatsapp/conversations/${conv.instance}/${encodeURIComponent(conv.remote_jid)}`, {
        method: 'PUT',
        body: JSON.stringify({ custom_name: name.trim() || null, notes: notes.trim() || null }),
      })
      onSaved()
    } catch (err) {
      alert('Erro: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function refreshProfile() {
    setRefreshing(true)
    try {
      const res = await apiFetch(`/api/whatsapp/conversations/${conv.instance}/${encodeURIComponent(conv.remote_jid)}/refresh-profile`, { method: 'POST' })
      setProfilePic(res.profile_pic_url)
    } catch (err) {
      alert('Erro: ' + err.message)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end" onClick={onClose}>
      <div className="bg-portal-bg border-l border-portal-border w-full max-w-md h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-portal-bg border-b border-portal-border px-4 py-3 flex items-center justify-between">
          <h2 className="text-portal-text font-semibold">Detalhes do contato</h2>
          <button onClick={onClose} className="text-portal-muted hover:text-portal-text text-2xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Avatar + refresh */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-portal-border">
            {profilePic ? (
              <img src={profilePic} alt="" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-portal-border/30 flex items-center justify-center text-4xl">💬</div>
            )}
            <button
              onClick={refreshProfile}
              disabled={refreshing}
              className="text-copper text-xs font-medium hover:text-copper-dark disabled:opacity-50"
            >
              {refreshing ? 'Buscando...' : '🔄 Atualizar foto'}
            </button>
          </div>

          {/* Info */}
          <div className="space-y-2 pb-4 border-b border-portal-border">
            <div>
              <p className="text-portal-muted text-xs">Telefone</p>
              <p className="text-portal-text text-sm font-mono">{conv.remote_phone}</p>
            </div>
            <div>
              <p className="text-portal-muted text-xs">Nome no WhatsApp</p>
              <p className="text-portal-text text-sm">{conv.remote_name || '—'}</p>
            </div>
            <div>
              <p className="text-portal-muted text-xs">Instância</p>
              <p className="text-portal-text text-sm">{conv.instance}</p>
            </div>
          </div>

          {/* Custom name */}
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Nome personalizado</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={150}
              placeholder="Ex: Paula - Cantina Dimensão"
              className="w-full px-3 py-2 bg-portal-surface border border-portal-border rounded-lg text-portal-text text-sm focus:outline-none focus:border-copper"
            />
            <p className="text-portal-muted text-xs mt-1">Sobrescreve o nome que vem do WhatsApp</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={5000}
              rows={8}
              placeholder="Anotações sobre este contato ou conversa..."
              className="w-full px-3 py-2 bg-portal-surface border border-portal-border rounded-lg text-portal-text text-sm focus:outline-none focus:border-copper resize-none"
            />
            <p className="text-portal-muted text-xs mt-1">{notes.length}/5000 caracteres</p>
          </div>

          {conv.notes_updated_at && (
            <p className="text-portal-muted text-xs">
              Notas atualizadas em {new Date(conv.notes_updated_at).toLocaleString('pt-BR')}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-portal-border">
            <button onClick={onClose} className="px-4 py-2 text-portal-muted text-sm hover:text-portal-text">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Gravador de áudio — MediaRecorder API
function AudioRecorder({ onSend }) {
  const [recording, setRecording] = useState(false)
  const [sending, setSending] = useState(false)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = e => e.data.size > 0 && chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType })
        if (blob.size < 1000) return // muito curto
        setSending(true)
        try {
          const base64 = await blobToBase64(blob)
          await onSend(base64)
        } finally {
          setSending(false)
        }
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
    } catch (err) {
      alert('Erro ao acessar microfone: ' + err.message)
    }
  }

  function stop() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
      recorderRef.current = null
    }
    setRecording(false)
  }

  function cancel() {
    chunksRef.current = []
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.onstop = null
      recorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    setRecording(false)
  }

  if (sending) {
    return <div className="text-portal-muted text-xs px-2">Enviando...</div>
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={cancel} title="Cancelar" className="text-danger text-lg hover:text-danger/80">✕</button>
        <span className="text-danger text-xs font-medium animate-pulse">● gravando</span>
        <button type="button" onClick={stop} title="Enviar" className="text-success text-xl hover:text-success/80">✓</button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={start}
      title="Gravar áudio"
      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-portal-border/30 text-portal-muted hover:text-copper transition-colors"
    >
      🎤
    </button>
  )
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = String(reader.result).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
