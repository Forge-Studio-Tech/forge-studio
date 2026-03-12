import { useState } from 'react'
import { useAuth } from '../../lib/auth.jsx'
import { useApi, apiFetch } from '../../hooks/useApi.js'
import { EditIcon, TrashIcon, CheckIcon, ActionBtn } from '../../components/portal/ActionIcons.jsx'

const STATUS_LABELS = { pending: 'Pendente', paid: 'Pago', overdue: 'Atrasado', cancelled: 'Cancelado' }
const STATUS_COLORS = {
  pending: 'bg-warning/15 text-warning',
  paid: 'bg-success/15 text-success',
  overdue: 'bg-danger/15 text-danger',
  cancelled: 'bg-portal-border/50 text-portal-muted',
}

export default function Billing() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { data, loading, refetch } = useApi('/api/payments')
  const { data: clientsData } = useApi('/api/clients', { skip: !isAdmin })
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const payments = data?.payments || []
  const clients = clientsData?.clients || []

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR')
  }

  function formatMonth(d) {
    if (!d) return '—'
    const date = new Date(d)
    const month = date.toLocaleDateString('pt-BR', { month: 'long' })
    const year = date.getFullYear().toString().slice(-2)
    return `${month.charAt(0).toUpperCase() + month.slice(1)}/${year}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">Financeiro</h1>
          <p className="text-portal-muted text-sm mt-1">
            {isAdmin ? 'Controle de cobrancas e pagamentos' : 'Seus pagamentos e plano contratado'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditing(null); setShowModal(true) }}
            className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Registrar Pagamento
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-portal-border">
                {isAdmin && <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Cliente</th>}
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Referencia</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Valor</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Vencimento</th>
                {isAdmin && <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Acao</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-portal-muted text-sm">
                    Nenhum pagamento encontrado.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-portal-border/10 transition-colors">
                    {isAdmin && <td className="px-6 py-4 text-portal-text text-sm hidden md:table-cell">{p.client_name}</td>}
                    <td className="px-6 py-4 text-portal-text text-sm capitalize">{formatMonth(p.reference_month)}</td>
                    <td className="px-6 py-4 text-portal-text text-sm font-medium">
                      R$ {Number(p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || ''}`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-portal-muted text-sm hidden md:table-cell">{formatDate(p.due_date)}</td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {(p.status === 'pending' || p.status === 'overdue') && (
                            <ActionBtn
                              title="Marcar Pago"
                              color="text-success"
                              hoverColor="hover:text-success/80"
                              onClick={async () => {
                                await apiFetch(`/api/payments/${p.id}`, {
                                  method: 'PUT',
                                  body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString() }),
                                })
                                refetch()
                              }}
                            >
                              <CheckIcon />
                            </ActionBtn>
                          )}
                          <ActionBtn title="Editar" color="text-copper" hoverColor="hover:text-copper-dark" onClick={() => { setEditing(p); setShowModal(true) }}>
                            <EditIcon />
                          </ActionBtn>
                          <ActionBtn
                            title="Apagar"
                            color="text-portal-muted"
                            hoverColor="hover:text-danger"
                            onClick={async () => {
                              if (!confirm('Apagar este pagamento?')) return
                              await apiFetch(`/api/payments/${p.id}`, { method: 'DELETE' })
                              refetch()
                            }}
                          >
                            <TrashIcon />
                          </ActionBtn>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <PaymentModal
          payment={editing}
          clients={clients}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={() => { setShowModal(false); setEditing(null); refetch() }}
        />
      )}
    </div>
  )
}

function PaymentModal({ payment, clients, onClose, onSaved }) {
  const isEdit = !!payment
  const [form, setForm] = useState({
    client_id: payment?.client_id || '',
    amount: payment?.amount || '',
    reference_month: payment?.reference_month?.split('T')[0] || '',
    due_date: payment?.due_date?.split('T')[0] || '',
    status: payment?.status || 'pending',
    notes: payment?.notes || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        const payload = { ...form }
        if (payload.status === 'paid' && !payment?.paid_at) {
          payload.paid_at = new Date().toISOString()
        }
        await apiFetch(`/api/payments/${payment.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/api/payments', {
          method: 'POST',
          body: JSON.stringify(form),
        })
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3 py-2 bg-portal-bg border border-portal-border rounded-lg text-portal-text text-sm focus:outline-none focus:border-copper"

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-portal-surface border border-portal-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-portal-text mb-4">{isEdit ? 'Editar Pagamento' : 'Registrar Pagamento'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Cliente</label>
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required disabled={isEdit} className={`${inputClass} disabled:opacity-50`}>
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name || c.user_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Valor (R$)</label>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className={inputClass} />
            </div>
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-portal-text mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Atrasado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Mes de referencia</label>
              <input type="date" value={form.reference_month} onChange={(e) => setForm({ ...form, reference_month: e.target.value })} required className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Vencimento</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Observacoes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-portal-muted text-sm hover:text-portal-text transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
