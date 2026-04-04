import { useState } from 'react'
import { useApi, apiFetch } from '../../../hooks/useApi.js'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'new', label: 'Novo' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'converted', label: 'Convertido' },
  { value: 'lost', label: 'Perdido' },
]

const STATUS_COLORS = {
  new: 'bg-copper/15 text-copper',
  contacted: 'bg-warning/15 text-warning',
  converted: 'bg-success/15 text-success',
  lost: 'bg-portal-border/30 text-portal-muted',
}

const STATUS_LABELS = {
  new: 'Novo',
  contacted: 'Contatado',
  converted: 'Convertido',
  lost: 'Perdido',
}

export default function Leads() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data, loading, refetch } = useApi(`/api/leads${statusFilter ? `?status=${statusFilter}` : ''}`)
  const [editingId, setEditingId] = useState(null)
  const [editNotes, setEditNotes] = useState('')

  const leads = data?.leads || []

  async function updateStatus(id, status) {
    try {
      await apiFetch(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
      refetch()
    } catch { /* silencioso */ }
  }

  async function saveNotes(id) {
    try {
      await apiFetch(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify({ notes: editNotes }) })
      setEditingId(null)
      refetch()
    } catch { /* silencioso */ }
  }

  async function deleteLead(id) {
    if (!confirm('Apagar este lead?')) return
    try {
      await apiFetch(`/api/leads/${id}`, { method: 'DELETE' })
      refetch()
    } catch { /* silencioso */ }
  }

  function openWhatsApp(lead) {
    const text = encodeURIComponent(`Olá ${lead.name}! Vi que você se interessou pelo Cadu. Posso te ajudar?`)
    const phone = lead.whatsapp?.replace(/\D/g, '')
    if (phone) window.open(`https://wa.me/55${phone}?text=${text}`, '_blank')
  }

  const fmtDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">Leads</h1>
          <p className="text-portal-muted text-sm">{leads.length} leads capturados</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-portal-surface border border-portal-border rounded-lg px-3 py-2 text-sm text-portal-text"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-portal-surface border border-portal-border rounded-xl p-8 text-center">
          <p className="text-portal-muted text-sm">Nenhum lead encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => (
            <div key={lead.id} className="bg-portal-surface border border-portal-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-portal-text font-semibold text-sm">{lead.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status] || STATUS_COLORS.new}`}>
                      {STATUS_LABELS[lead.status] || lead.status}
                    </span>
                    <span className="text-portal-muted text-xs">{lead.source}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-portal-muted">
                    {lead.whatsapp && <span>📱 {lead.whatsapp}</span>}
                    {lead.business_name && <span>🏢 {lead.business_name}</span>}
                    {lead.segment && <span>📋 {lead.segment}</span>}
                    <span>🕐 {fmtDate(lead.created_at)}</span>
                  </div>
                  {lead.features?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lead.features.map((f, i) => (
                        <span key={i} className="text-xs bg-portal-border/20 text-portal-muted px-2 py-0.5 rounded">{f}</span>
                      ))}
                    </div>
                  )}
                  {lead.message && (
                    <p className="text-portal-muted text-xs mt-2 italic">"{lead.message}"</p>
                  )}
                  {/* Notas */}
                  {editingId === lead.id ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Adicionar nota..."
                        className="flex-1 bg-portal-bg border border-portal-border rounded-lg px-3 py-1.5 text-sm text-portal-text"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveNotes(lead.id)}
                      />
                      <button onClick={() => saveNotes(lead.id)} className="text-copper text-xs font-medium">Salvar</button>
                      <button onClick={() => setEditingId(null)} className="text-portal-muted text-xs">Cancelar</button>
                    </div>
                  ) : lead.notes ? (
                    <p className="text-portal-text text-xs mt-2 cursor-pointer hover:text-copper" onClick={() => { setEditingId(lead.id); setEditNotes(lead.notes) }}>
                      📝 {lead.notes}
                    </p>
                  ) : (
                    <button onClick={() => { setEditingId(lead.id); setEditNotes('') }} className="text-portal-muted text-xs mt-2 hover:text-copper">
                      + Adicionar nota
                    </button>
                  )}
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-1 shrink-0">
                  {lead.whatsapp && (
                    <button onClick={() => openWhatsApp(lead)} className="text-xs text-copper hover:text-copper-dark font-medium" title="Abrir WhatsApp">
                      💬 WhatsApp
                    </button>
                  )}
                  <select
                    value={lead.status || 'new'}
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    className="text-xs bg-portal-bg border border-portal-border rounded px-2 py-1 text-portal-text"
                  >
                    <option value="new">Novo</option>
                    <option value="contacted">Contatado</option>
                    <option value="converted">Convertido</option>
                    <option value="lost">Perdido</option>
                  </select>
                  <button onClick={() => deleteLead(lead.id)} className="text-xs text-danger hover:text-danger/80">Apagar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
