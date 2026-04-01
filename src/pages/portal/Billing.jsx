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

const EXPENSE_CATEGORIES = [
  'Infraestrutura', 'Software', 'Marketing', 'Impostos', 'Servicos',
  'Equipamentos', 'Escritorio', 'Viagem', 'Alimentacao', 'Outros',
]

const TABS = [
  { key: 'payments', label: 'Pagamentos' },
  { key: 'sales', label: 'Vendas' },
  { key: 'expenses', label: 'Despesas' },
]

export default function Billing() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [activeTab, setActiveTab] = useState('payments')

  const { data: paymentsData, loading: loadingPayments, refetch: refetchPayments } = useApi('/api/payments')
  const { data: salesData, loading: loadingSales, refetch: refetchSales } = useApi('/api/sales', { skip: !isAdmin })
  const { data: expensesData, loading: loadingExpenses, refetch: refetchExpenses } = useApi('/api/expenses', { skip: !isAdmin })
  const { data: clientsData } = useApi('/api/clients', { skip: !isAdmin })
  const { data: projectsData } = useApi('/api/projects', { skip: !isAdmin })

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const payments = paymentsData?.payments || []
  const sales = salesData?.sales || []
  const expenses = expensesData?.expenses || []
  const clients = clientsData?.clients || []
  const projects = projectsData?.projects || []

  // Resumo financeiro
  const totalPayments = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const totalPending = payments.filter((p) => p.status === 'pending' || p.status === 'overdue').reduce((s, p) => s + Number(p.amount), 0)
  const totalSales = sales.reduce((s, v) => s + Number(v.amount), 0)
  const totalExpenses = expenses.reduce((s, d) => s + Number(d.amount), 0)
  const totalCommission = sales.reduce((s, v) => s + Number(v.commission_amount || 0), 0)

  function openModal(item = null) {
    setEditing(item)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
  }

  const refetchMap = { payments: refetchPayments, sales: refetchSales, expenses: refetchExpenses }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">Financeiro</h1>
          <p className="text-portal-muted text-sm mt-1">
            {isAdmin ? 'Controle de cobranças, vendas e despesas' : 'Seus pagamentos e plano contratado'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => openModal()}
            className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {activeTab === 'payments' ? 'Registrar Pagamento' : activeTab === 'sales' ? 'Registrar Venda' : 'Registrar Despesa'}
          </button>
        )}
      </div>

      {/* Summary cards (admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <SummaryCard label="Recebido" value={totalPayments} color="text-success" />
          <SummaryCard label="Pendente" value={totalPending} color="text-warning" />
          <SummaryCard label="Vendas" value={totalSales} color="text-copper" />
          <SummaryCard label="Despesas" value={totalExpenses} color="text-danger" />
          <SummaryCard label="Comissoes" value={totalCommission} color="text-portal-muted" />
        </div>
      )}

      {/* Tabs (admin only) */}
      {isAdmin && (
        <div className="flex flex-wrap gap-1 mb-6 bg-portal-surface border border-portal-border rounded-lg p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-copper text-stone-950'
                  : 'text-portal-muted hover:text-portal-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'payments' && (
        <PaymentsTab
          payments={payments}
          loading={loadingPayments}
          isAdmin={isAdmin}
          refetch={refetchPayments}
          onEdit={openModal}
        />
      )}
      {activeTab === 'sales' && isAdmin && (
        <SalesTab
          sales={sales}
          loading={loadingSales}
          refetch={refetchSales}
          onEdit={openModal}
        />
      )}
      {activeTab === 'expenses' && isAdmin && (
        <ExpensesTab
          expenses={expenses}
          loading={loadingExpenses}
          refetch={refetchExpenses}
          onEdit={openModal}
        />
      )}

      {/* Modals */}
      {showModal && activeTab === 'payments' && (
        <PaymentModal
          payment={editing}
          clients={clients}
          onClose={closeModal}
          onSaved={() => { closeModal(); refetchPayments() }}
        />
      )}
      {showModal && activeTab === 'sales' && (
        <SaleModal
          sale={editing}
          clients={clients}
          projects={projects}
          onClose={closeModal}
          onSaved={() => { closeModal(); refetchSales() }}
        />
      )}
      {showModal && activeTab === 'expenses' && (
        <ExpenseModal
          expense={editing}
          clients={clients}
          onClose={closeModal}
          onSaved={() => { closeModal(); refetchExpenses() }}
        />
      )}
    </div>
  )
}

// ── Summary Card ──
function SummaryCard({ label, value, color = 'text-portal-text' }) {
  return (
    <div className="bg-portal-surface border border-portal-border rounded-xl p-4">
      <p className="text-portal-muted text-xs mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>
        R$ {Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

// ── Helpers ──
function formatDate(d) {
  if (!d) return '—'
  const str = typeof d === 'string' ? d.split('T')[0] : d
  const [y, m, day] = str.split('-')
  return `${day}/${m}/${y}`
}

function formatMonth(d) {
  if (!d) return '—'
  // Parse como data local (adiciona T00:00 pra evitar interpretação UTC)
  const str = typeof d === 'string' ? d.split('T')[0] : d
  const [y, m] = str.split('-')
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return `${months[Number(m) - 1]}/${y.slice(-2)}`
}

function formatCurrency(v) {
  return `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

const inputClass = 'w-full px-3 py-2 bg-portal-bg border border-portal-border rounded-lg text-portal-text text-sm focus:outline-none focus:border-copper'
const thClass = 'text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider'

function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-8 text-center text-portal-muted text-sm">{text}</td>
    </tr>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB: PAGAMENTOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PaymentsTab({ payments, loading, isAdmin, refetch, onEdit }) {
  if (loading) return <Spinner />
  return (
    <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-portal-border">
            {isAdmin && <th className={`${thClass} hidden md:table-cell`}>Cliente</th>}
            <th className={thClass}>Referência</th>
            <th className={thClass}>Valor</th>
            <th className={thClass}>Status</th>
            <th className={`${thClass} hidden md:table-cell`}>Vencimento</th>
            {isAdmin && <th className={thClass}>Ação</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-portal-border">
          {payments.length === 0 ? (
            <EmptyRow colSpan={6} text="Nenhum pagamento encontrado." />
          ) : (
            payments.map((p) => (
              <tr key={p.id} className="hover:bg-portal-border/10 transition-colors">
                {isAdmin && <td className="px-6 py-4 text-portal-text text-sm hidden md:table-cell">{p.client_name}</td>}
                <td className="px-6 py-4 text-portal-text text-sm capitalize">{formatMonth(p.reference_month)}</td>
                <td className="px-6 py-4 text-portal-text text-sm font-medium">{formatCurrency(p.amount)}</td>
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
                      <ActionBtn title="Editar" color="text-copper" hoverColor="hover:text-copper-dark" onClick={() => onEdit(p)}>
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
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB: VENDAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SalesTab({ sales, loading, refetch, onEdit }) {
  if (loading) return <Spinner />
  return (
    <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-portal-border">
            <th className={thClass}>Descricao</th>
            <th className={`${thClass} hidden md:table-cell`}>Cliente</th>
            <th className={`${thClass} hidden md:table-cell`}>Projeto</th>
            <th className={thClass}>Valor</th>
            <th className={`${thClass} hidden md:table-cell`}>Comissão</th>
            <th className={`${thClass} hidden md:table-cell`}>Data</th>
            <th className={thClass}>Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-portal-border">
          {sales.length === 0 ? (
            <EmptyRow colSpan={7} text="Nenhuma venda registrada." />
          ) : (
            sales.map((s) => (
              <tr key={s.id} className="hover:bg-portal-border/10 transition-colors">
                <td className="px-6 py-4 text-portal-text text-sm">{s.description}</td>
                <td className="px-6 py-4 text-portal-text text-sm hidden md:table-cell">{s.client_name || '—'}</td>
                <td className="px-6 py-4 text-portal-text text-sm hidden md:table-cell">{s.project_name || '—'}</td>
                <td className="px-6 py-4 text-portal-text text-sm font-medium">{formatCurrency(s.amount)}</td>
                <td className="px-6 py-4 hidden md:table-cell">
                  {Number(s.commission_amount) > 0 ? (
                    <div>
                      <span className="text-portal-text text-sm">{formatCurrency(s.commission_amount)}</span>
                      <span className={`ml-2 text-xs ${s.commission_paid ? 'text-success' : 'text-warning'}`}>
                        {s.commission_paid ? 'Paga' : 'Pendente'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-portal-muted text-sm">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-portal-muted text-sm hidden md:table-cell">{formatDate(s.sale_date)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    {Number(s.commission_amount) > 0 && !s.commission_paid && (
                      <ActionBtn
                        title="Marcar Comissão Paga"
                        color="text-success"
                        hoverColor="hover:text-success/80"
                        onClick={async () => {
                          await apiFetch(`/api/sales/${s.id}`, {
                            method: 'PUT',
                            body: JSON.stringify({ commission_paid: true }),
                          })
                          refetch()
                        }}
                      >
                        <CheckIcon />
                      </ActionBtn>
                    )}
                    <ActionBtn title="Editar" color="text-copper" hoverColor="hover:text-copper-dark" onClick={() => onEdit(s)}>
                      <EditIcon />
                    </ActionBtn>
                    <ActionBtn
                      title="Apagar"
                      color="text-portal-muted"
                      hoverColor="hover:text-danger"
                      onClick={async () => {
                        if (!confirm('Apagar esta venda?')) return
                        await apiFetch(`/api/sales/${s.id}`, { method: 'DELETE' })
                        refetch()
                      }}
                    >
                      <TrashIcon />
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB: DESPESAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ExpensesTab({ expenses, loading, refetch, onEdit }) {
  if (loading) return <Spinner />
  return (
    <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-portal-border">
            <th className={thClass}>Descricao</th>
            <th className={`${thClass} hidden md:table-cell`}>Categoria</th>
            <th className={`${thClass} hidden md:table-cell`}>Cliente</th>
            <th className={thClass}>Valor</th>
            <th className={`${thClass} hidden md:table-cell`}>Data</th>
            <th className={thClass}>Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-portal-border">
          {expenses.length === 0 ? (
            <EmptyRow colSpan={6} text="Nenhuma despesa registrada." />
          ) : (
            expenses.map((d) => (
              <tr key={d.id} className="hover:bg-portal-border/10 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-portal-text text-sm">{d.description}</p>
                  {d.notes && <p className="text-portal-muted text-xs mt-0.5">{d.notes}</p>}
                </td>
                <td className="px-6 py-4 text-portal-text text-sm hidden md:table-cell">
                  {d.category ? (
                    <span className="bg-portal-border/30 text-portal-text text-xs px-2 py-0.5 rounded-full">{d.category}</span>
                  ) : '—'}
                </td>
                <td className="px-6 py-4 text-portal-text text-sm hidden md:table-cell">{d.client_name || '—'}</td>
                <td className="px-6 py-4 text-danger text-sm font-medium">{formatCurrency(d.amount)}</td>
                <td className="px-6 py-4 text-portal-muted text-sm hidden md:table-cell">{formatDate(d.expense_date)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <ActionBtn title="Editar" color="text-copper" hoverColor="hover:text-copper-dark" onClick={() => onEdit(d)}>
                      <EditIcon />
                    </ActionBtn>
                    <ActionBtn
                      title="Apagar"
                      color="text-portal-muted"
                      hoverColor="hover:text-danger"
                      onClick={async () => {
                        if (!confirm('Apagar esta despesa?')) return
                        await apiFetch(`/api/expenses/${d.id}`, { method: 'DELETE' })
                        refetch()
                      }}
                    >
                      <TrashIcon />
                    </ActionBtn>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODAL: PAGAMENTO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
        await apiFetch(`/api/payments/${payment.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/api/payments', { method: 'POST', body: JSON.stringify(form) })
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={isEdit ? 'Editar Pagamento' : 'Registrar Pagamento'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-portal-text mb-1">Cliente</label>
          <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required disabled={isEdit} className={`${inputClass} h-[38px] disabled:opacity-50`}>
            <option value="">Selecione...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name || c.user_name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Valor (R$)</label>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className={inputClass} />
          </div>
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-portal-text mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={`${inputClass} h-[38px]`}>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="overdue">Atrasado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <label className="block text-sm font-medium text-portal-text mb-1">Observações</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
        </div>
        {error && <p className="text-danger text-sm">{error}</p>}
        <ModalActions onClose={onClose} saving={saving} isEdit={isEdit} />
      </form>
    </ModalShell>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODAL: VENDA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SaleModal({ sale, clients, projects, onClose, onSaved }) {
  const isEdit = !!sale
  const [form, setForm] = useState({
    client_id: sale?.client_id || '',
    project_id: sale?.project_id || '',
    description: sale?.description || '',
    amount: sale?.amount || '',
    sale_date: sale?.sale_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    commission_type: sale?.commission_type || '',
    commission_rate: sale?.commission_rate || '',
    commission_paid: sale?.commission_paid || false,
    notes: sale?.notes || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Quando seleciona um cliente, preenche comissao do cliente
  function handleClientChange(clientId) {
    const client = clients.find((c) => c.id === clientId)
    const updates = { client_id: clientId }
    if (client?.has_commission && !isEdit) {
      updates.commission_type = client.commission_type || ''
      updates.commission_rate = client.commission_value || ''
    } else if (!isEdit) {
      updates.commission_type = ''
      updates.commission_rate = ''
    }
    setForm({ ...form, ...updates })
  }

  // Calcula comissao para exibicao
  const commissionPreview = form.commission_type && form.commission_rate && form.amount
    ? form.commission_type === 'percent'
      ? (Number(form.amount) * Number(form.commission_rate) / 100)
      : Number(form.commission_rate)
    : 0

  // Filtra projetos pelo cliente selecionado
  const filteredProjects = form.client_id
    ? projects.filter((p) => p.client_id === form.client_id)
    : projects

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      if (isEdit) {
        await apiFetch(`/api/sales/${sale.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/api/sales', { method: 'POST', body: JSON.stringify(payload) })
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedClient = clients.find((c) => c.id === form.client_id)

  return (
    <ModalShell title={isEdit ? 'Editar Venda' : 'Registrar Venda'} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Cliente</label>
            <select value={form.client_id} onChange={(e) => handleClientChange(e.target.value)} className={`${inputClass} h-[38px]`}>
              <option value="">Nenhum</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name || c.user_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Projeto</label>
            <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className={`${inputClass} h-[38px]`}>
              <option value="">Nenhum</option>
              {filteredProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-portal-text mb-1">Descricao</label>
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className={inputClass} placeholder="Ex: Site institucional completo" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Valor da Venda (R$)</label>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Data da Venda</label>
            <input type="date" value={form.sale_date} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} required className={inputClass} />
          </div>
        </div>

        {/* Comissao */}
        <div className="border border-portal-border rounded-lg p-4">
          <p className="text-sm font-medium text-portal-text mb-3">Comissão</p>
          {selectedClient?.has_commission && (
            <p className="text-xs text-portal-muted mb-3">
              Preenchido automaticamente a partir do cadastro de {selectedClient.company_name || selectedClient.user_name}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-portal-muted mb-1">Tipo</label>
              <select value={form.commission_type} onChange={(e) => setForm({ ...form, commission_type: e.target.value })} className={`${inputClass} h-[38px]`}>
                <option value="">Sem comissão</option>
                <option value="percent">Percentual (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-portal-muted mb-1">
                {form.commission_type === 'percent' ? 'Taxa (%)' : 'Valor (R$)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={form.commission_rate}
                onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                disabled={!form.commission_type}
                className={`${inputClass} disabled:opacity-50`}
              />
            </div>
            <div>
              <label className="block text-xs text-portal-muted mb-1">Valor calculado</label>
              <p className="text-portal-text text-sm font-medium py-2">{formatCurrency(commissionPreview)}</p>
            </div>
          </div>
          {isEdit && Number(form.commission_rate) > 0 && (
            <label className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={form.commission_paid}
                onChange={(e) => setForm({ ...form, commission_paid: e.target.checked })}
                className="rounded border-portal-border text-copper focus:ring-copper"
              />
              <span className="text-sm text-portal-text">Comissão paga</span>
            </label>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-portal-text mb-1">Observações</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
        </div>
        {error && <p className="text-danger text-sm">{error}</p>}
        <ModalActions onClose={onClose} saving={saving} isEdit={isEdit} />
      </form>
    </ModalShell>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODAL: DESPESA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ExpenseModal({ expense, clients, onClose, onSaved }) {
  const isEdit = !!expense
  const [form, setForm] = useState({
    client_id: expense?.client_id || '',
    description: expense?.description || '',
    amount: expense?.amount || '',
    expense_date: expense?.expense_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    category: expense?.category || '',
    notes: expense?.notes || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        await apiFetch(`/api/expenses/${expense.id}`, { method: 'PUT', body: JSON.stringify(form) })
      } else {
        await apiFetch('/api/expenses', { method: 'POST', body: JSON.stringify(form) })
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={isEdit ? 'Editar Despesa' : 'Registrar Despesa'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-portal-text mb-1">Descricao</label>
          <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className={inputClass} placeholder="Ex: Hospedagem VPS Hostinger" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Valor (R$)</label>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Data</label>
            <input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Categoria</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`${inputClass} h-[38px]`}>
              <option value="">Selecione...</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-portal-text mb-1">Cliente (opcional)</label>
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className={`${inputClass} h-[38px]`}>
              <option value="">Nenhum</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name || c.user_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-portal-text mb-1">Observações</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
        </div>
        {error && <p className="text-danger text-sm">{error}</p>}
        <ModalActions onClose={onClose} saving={saving} isEdit={isEdit} />
      </form>
    </ModalShell>
  )
}

// ── Shared modal components ──
function ModalShell({ title, onClose, wide, children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-portal-surface border border-portal-border rounded-xl p-6 w-full ${wide ? 'max-w-lg' : 'max-w-md'}`} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-portal-text mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}

function ModalActions({ onClose, saving, isEdit }) {
  return (
    <div className="flex gap-3 justify-end pt-2">
      <button type="button" onClick={onClose} className="px-4 py-2 text-portal-muted text-sm hover:text-portal-text transition-colors">
        Cancelar
      </button>
      <button type="submit" disabled={saving} className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
        {saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
      </button>
    </div>
  )
}
