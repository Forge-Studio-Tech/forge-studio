import { useState } from 'react'
import { useApi, apiFetch } from '../../../hooks/useApi.js'

const STATUS_COLORS = {
  open: { bg: 'bg-success/15', text: 'text-success', label: 'Conectado' },
  connecting: { bg: 'bg-warning/15', text: 'text-warning', label: 'Conectando...' },
  close: { bg: 'bg-danger/15', text: 'text-danger', label: 'Desconectado' },
}

export default function WhatsAppConfig() {
  const { data, loading, refetch } = useApi('/api/whatsapp/instances')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [qrCode, setQrCode] = useState(null)
  const [qrInstance, setQrInstance] = useState(null)
  const [saving, setSaving] = useState(false)

  const instances = data?.instances || []

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await apiFetch('/api/whatsapp/instances', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (res.qrcode) {
        setQrCode(res.qrcode)
        setQrInstance(newName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'))
      }
      setNewName('')
      setCreating(false)
      refetch()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function showQrCode(name) {
    try {
      const res = await apiFetch(`/api/whatsapp/instances/${name}/qrcode`)
      if (res.qrcode) {
        setQrCode(res.qrcode)
        setQrInstance(name)
      } else {
        alert('Instância já conectada ou QR Code não disponível')
      }
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleLogout(name) {
    if (!confirm(`Desconectar a instância "${name}"?`)) return
    try {
      await apiFetch(`/api/whatsapp/instances/${name}/logout`, { method: 'POST' })
      refetch()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleRestart(name) {
    try {
      await apiFetch(`/api/whatsapp/instances/${name}/restart`, { method: 'POST' })
      setTimeout(refetch, 2000)
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDelete(name) {
    if (!confirm(`Remover a instância "${name}" permanentemente? Esta ação não pode ser desfeita.`)) return
    try {
      await apiFetch(`/api/whatsapp/instances/${name}`, { method: 'DELETE' })
      refetch()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">WhatsApp</h1>
          <p className="text-portal-muted text-sm">Gerencie as instâncias do WhatsApp</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Nova Instância
        </button>
      </div>

      {/* QR Code Modal */}
      {qrCode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setQrCode(null); setQrInstance(null) }}>
          <div className="bg-portal-surface border border-portal-border rounded-xl p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-portal-text mb-2">Escaneie o QR Code</h3>
            <p className="text-portal-muted text-sm mb-4">
              Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo
            </p>
            <img src={qrCode} alt="QR Code WhatsApp" className="mx-auto rounded-lg mb-4" style={{ maxWidth: '280px' }} />
            <p className="text-portal-muted text-xs mb-4">Instância: {qrInstance}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => { showQrCode(qrInstance) }}
                className="text-copper text-sm font-medium hover:text-copper-dark"
              >
                Gerar novo QR
              </button>
              <button
                onClick={() => { setQrCode(null); setQrInstance(null); refetch() }}
                className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create form */}
      {creating && (
        <div className="bg-portal-surface border border-portal-border rounded-xl p-5 mb-6">
          <form onSubmit={handleCreate} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-portal-muted mb-1">Nome da instância</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: cadu, forge, suporte..."
                className="w-full bg-portal-bg border border-portal-border rounded-lg px-3 py-2 text-sm text-portal-text focus:outline-none focus:border-copper"
                autoFocus
              />
            </div>
            <button type="submit" disabled={saving} className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              {saving ? 'Criando...' : 'Criar'}
            </button>
            <button type="button" onClick={() => setCreating(false)} className="text-portal-muted text-sm hover:text-portal-text">
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Instances list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
        </div>
      ) : instances.length === 0 ? (
        <div className="bg-portal-surface border border-portal-border rounded-xl p-8 text-center">
          <p className="text-portal-muted text-sm">Nenhuma instância configurada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {instances.map(inst => {
            const st = STATUS_COLORS[inst.status] || STATUS_COLORS.close
            return (
              <div key={inst.name} className="bg-portal-surface border border-portal-border rounded-xl p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {inst.profilePic ? (
                      <img src={inst.profilePic} alt="" className="w-12 h-12 rounded-full shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-portal-border/30 flex items-center justify-center text-xl shrink-0">💬</div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-portal-text font-semibold text-sm">{inst.profileName || inst.name}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-portal-muted text-xs">
                        {inst.phone ? `+${inst.phone}` : 'Sem número'} — {inst.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {inst.status !== 'open' && (
                      <button onClick={() => showQrCode(inst.name)} className="text-copper text-xs font-medium hover:text-copper-dark">
                        QR Code
                      </button>
                    )}
                    {inst.status === 'open' && (
                      <button onClick={() => handleLogout(inst.name)} className="text-warning text-xs font-medium hover:text-warning/80">
                        Desconectar
                      </button>
                    )}
                    {inst.status === 'close' && (
                      <button onClick={() => handleRestart(inst.name)} className="text-copper text-xs font-medium hover:text-copper-dark">
                        Reconectar
                      </button>
                    )}
                    <button onClick={() => handleDelete(inst.name)} className="text-danger text-xs font-medium hover:text-danger/80">
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
