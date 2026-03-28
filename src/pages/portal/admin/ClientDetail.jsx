import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApi, apiFetch } from '../../../hooks/useApi.js'
import { useAuth } from '../../../lib/auth.jsx'
import { EditIcon, ArchiveIcon, RestoreIcon, ActionBtn } from '../../../components/portal/ActionIcons.jsx'

const STATUS_LABELS = { active: 'Ativo', inactive: 'Inativo', prospect: 'Prospecto', churned: 'Churned' }
const DOMAIN_LABELS = { forge: 'Forge Studio', client: 'Cliente', third_party: 'Terceiro' }
const PROJECT_STATUS = {
  briefing: 'Briefing', design: 'Design', development: 'Desenvolvimento',
  review: 'Revisao', published: 'Publicado', maintenance: 'Manutencao', archived: 'Arquivado',
}
const PAYMENT_STATUS = { pending: 'Pendente', paid: 'Pago', overdue: 'Atrasado', cancelled: 'Cancelado' }

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { startImpersonation } = useAuth()
  const { data, loading, error, refetch } = useApi(`/api/clients/${id}`)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/30 rounded-xl p-6 text-center">
        <p className="text-danger text-sm">{error}</p>
        <Link to="/portal/admin/clients" className="text-copper text-sm mt-2 inline-block">Voltar</Link>
      </div>
    )
  }

  const client = data?.client
  const projects = data?.projects || []
  const payments = data?.payments || []
  const plans = data?.plans || []
  if (!client) return null

  const displayName = client.company_name || client.user_name

  return (
    <div>
      <Link to="/portal/admin/clients" className="text-portal-muted hover:text-copper text-sm mb-4 inline-block transition-colors">
        &larr; Voltar aos clientes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">{displayName}</h1>
          {client.company_name && <p className="text-portal-muted text-sm">{client.user_name}</p>}
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={client.status} />
            {client.lgpd_consent_at ? (
              <span className="text-success text-xs font-medium">LGPD Aceito</span>
            ) : (
              <span className="text-warning text-xs font-medium">LGPD Pendente</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {client.user_id && (
            <button
              onClick={async () => {
                try {
                  await startImpersonation(client.user_id)
                  navigate('/portal')
                } catch (err) {
                  alert(err.message)
                }
              }}
              className="flex items-center gap-2 bg-portal-surface border border-portal-border hover:border-copper/40 text-portal-text px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              Visualizar como cliente
            </button>
          )}
          <button
            onClick={() => navigate(`/portal/admin/clients?edit=${id}`)}
            className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Editar
          </button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Projetos" value={projects.length} />
        <StatCard label="MRR" value={`R$ ${Number(client.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="text-copper" />
        <StatCard label="Planos Ativos" value={plans.filter((p) => p.is_active).length} />
        <StatCard label="Pagamentos" value={payments.length} />
      </div>

      {/* Grid de detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Dados do cliente */}
        <section className="bg-portal-surface border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-portal-text mb-4">Dados</h2>
          <dl className="space-y-3">
            <Detail label="Email" value={client.email} />
            {client.phone && <Detail label="Telefone" value={client.phone} />}
            {client.cnpj_cpf && <Detail label="CPF/CNPJ" value={client.cnpj_cpf} />}
            {client.segment && <Detail label="Segmento" value={client.segment} />}
            {client.acquisition_channel && <Detail label="Canal de Origem" value={client.acquisition_channel} />}
            {client.referred_by && <Detail label="Indicado por" value={client.referred_by} />}
            {client.has_commission && (
              <Detail
                label="Comissao"
                value={
                  client.commission_type === 'percent'
                    ? `${Number(client.commission_value)}% sobre venda do projeto`
                    : `R$ ${Number(client.commission_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sobre venda do projeto`
                }
              />
            )}
          </dl>
        </section>

        {/* Dominio e endereco */}
        <section className="bg-portal-surface border border-portal-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-portal-text mb-4">Dominio e Endereco</h2>
          <dl className="space-y-3">
            {client.domain_ownership && <Detail label="Titularidade" value={DOMAIN_LABELS[client.domain_ownership] || client.domain_ownership} />}
            {client.domain_renewal_date && <Detail label="Renovacao" value={new Date(client.domain_renewal_date).toLocaleDateString('pt-BR')} />}
            {client.billing_day && <Detail label="Dia de Vencimento" value={client.billing_day} />}
            {(client.street || client.city) && (
              <Detail
                label="Endereco"
                value={[
                  [client.street, client.address_number].filter(Boolean).join(', '),
                  client.complement,
                  [client.city, client.state].filter(Boolean).join(' - '),
                  client.cep,
                ].filter(Boolean).join(' — ')}
              />
            )}
          </dl>
          {client.notes && (
            <div className="mt-4 pt-4 border-t border-portal-border">
              <p className="text-xs font-medium text-portal-muted uppercase tracking-wider mb-1">Observacoes</p>
              <p className="text-portal-text text-sm whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </section>
      </div>

      {/* Projetos */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-portal-text mb-4">Projetos</h2>
        {projects.length === 0 ? (
          <p className="text-portal-muted text-sm bg-portal-surface border border-portal-border rounded-xl p-6 text-center">
            Nenhum projeto cadastrado.
          </p>
        ) : (
          <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-portal-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Projeto</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-portal-border">
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/portal/projects/${p.id}`)}
                    className="hover:bg-portal-border/10 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="text-portal-text text-sm font-medium">{p.name}</p>
                      {p.domain && <p className="text-portal-muted text-xs">{p.domain}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.status === 'published' ? 'bg-success/15 text-success'
                          : p.status === 'archived' ? 'bg-portal-border/30 text-portal-muted'
                          : 'bg-copper/15 text-copper'
                      }`}>
                        {PROJECT_STATUS[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-portal-muted text-sm capitalize hidden md:table-cell">
                      {p.type?.replace('_', ' ') || '—'}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-3">
                        {p.production_url && (
                          <a
                            href={p.production_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`text-xs font-medium ${p.status === 'published' ? 'text-success hover:text-success/80' : 'text-copper hover:text-copper-dark'}`}
                          >
                            Site
                          </a>
                        )}
                        {p.preview_url && (
                          <a
                            href={p.preview_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-copper hover:text-copper-dark text-xs font-medium"
                          >
                            Preview
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Planos */}
      {plans.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-portal-text mb-4">Planos</h2>
          <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-portal-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Plano</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Valor</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-portal-border">
                {plans.map((pl) => (
                  <tr key={pl.id} className="hover:bg-portal-border/10 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-portal-text text-sm font-medium capitalize">{pl.type?.replace('_', ' ') || '—'}</p>
                      {pl.tier && <p className="text-portal-muted text-xs capitalize">{pl.tier}</p>}
                    </td>
                    <td className="px-6 py-4 text-portal-text text-sm font-medium">
                      R$ {Number(pl.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium ${pl.is_active ? 'text-success' : 'text-portal-muted'}`}>
                        {pl.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Pagamentos */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-portal-text mb-4">Pagamentos</h2>
        {payments.length === 0 ? (
          <p className="text-portal-muted text-sm bg-portal-surface border border-portal-border rounded-xl p-6 text-center">
            Nenhum pagamento registrado.
          </p>
        ) : (
          <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-portal-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Referencia</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Valor</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Vencimento</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-portal-border">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-portal-border/10 transition-colors">
                    <td className="px-6 py-4 text-portal-text text-sm">
                      {formatReference(pay.reference_month)}
                    </td>
                    <td className="px-6 py-4 text-portal-text text-sm font-medium">
                      R$ {Number(pay.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-portal-muted text-sm">
                      {pay.due_date ? new Date(pay.due_date).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        pay.status === 'paid' ? 'bg-success/15 text-success'
                          : pay.status === 'overdue' ? 'bg-danger/15 text-danger'
                          : 'bg-warning/15 text-warning'
                      }`}>
                        {PAYMENT_STATUS[pay.status] || pay.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, color = 'text-portal-text' }) {
  return (
    <div className="bg-portal-surface border border-portal-border rounded-xl p-4">
      <p className="text-portal-muted text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const colors = {
    active: 'bg-success/15 text-success',
    inactive: 'bg-portal-border/30 text-portal-muted',
    prospect: 'bg-copper/15 text-copper',
    churned: 'bg-danger/15 text-danger',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] || 'bg-portal-border/30 text-portal-muted'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function EyeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium text-portal-muted uppercase tracking-wider">{label}</dt>
      <dd className="text-portal-text text-sm mt-0.5">{value}</dd>
    </div>
  )
}

const MONTHS = ['', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function formatReference(ref) {
  if (!ref) return '—'
  const [y, m] = ref.split('-')
  const month = MONTHS[parseInt(m)] || m
  return `${month}/${y.slice(2)}`
}
