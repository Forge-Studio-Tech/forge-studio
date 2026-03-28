import { useState } from 'react'
import { useApi, apiFetch } from '../../../hooks/useApi.js'

const ACTION_LABELS = {
  consent_granted: 'Consentimento aceito',
  consent_revoked: 'Consentimento revogado',
  data_exported: 'Dados exportados',
  data_deleted: 'Dados excluídos',
}

const ROLE_LABELS = { admin: 'Admin', client: 'Cliente' }
const ROLE_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'client', label: 'Clientes' },
  { value: 'admin', label: 'Admins' },
]

export default function AdminLgpd() {
  const [tab, setTab] = useState('consents')
  const [roleFilter, setRoleFilter] = useState('all')
  const { data: consentsData, loading: loadingConsents } = useApi('/api/lgpd')
  const { data: auditData, loading: loadingAudit } = useApi('/api/lgpd/audit')
  const [exporting, setExporting] = useState(false)

  const allRecords = consentsData?.records || []
  const records = roleFilter === 'all' ? allRecords : allRecords.filter((r) => r.role === roleFilter)
  const audit = auditData?.audit || []

  async function handleExport() {
    setExporting(true)
    try {
      const res = await apiFetch('/api/lgpd/export')
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lgpd-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Erro ao exportar: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const totalUsers = records.length
  const consented = records.filter((r) => r.lgpd_consent_at).length
  const pending = totalUsers - consented
  const withMarketing = records.filter((r) => r.consent_details?.marketing).length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">LGPD</h1>
          <p className="text-portal-muted text-sm">Consentimentos e auditoria de dados pessoais</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {exporting ? 'Exportando...' : 'Exportar JSON'}
        </button>
      </div>

      {/* Filtro por tipo */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-portal-muted text-sm">Filtrar:</span>
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setRoleFilter(f.value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              roleFilter === f.value
                ? 'bg-copper/15 text-copper'
                : 'text-portal-muted hover:text-portal-text hover:bg-portal-border/20'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Usuários" value={totalUsers} />
        <SummaryCard label="Consentimento OK" value={consented} color="text-success" />
        <SummaryCard label="Pendente" value={pending} color={pending > 0 ? 'text-warning' : 'text-portal-muted'} />
        <SummaryCard label="Marketing Aceito" value={withMarketing} color="text-copper" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <TabBtn active={tab === 'consents'} onClick={() => setTab('consents')}>Consentimentos</TabBtn>
        <TabBtn active={tab === 'audit'} onClick={() => setTab('audit')}>Log de Auditoria</TabBtn>
      </div>

      {tab === 'consents' && (
        <ConsentsTable records={records} loading={loadingConsents} />
      )}

      {tab === 'audit' && (
        <AuditTable audit={audit} loading={loadingAudit} />
      )}
    </div>
  )
}

function SummaryCard({ label, value, color = 'text-portal-text' }) {
  return (
    <div className="bg-portal-surface border border-portal-border rounded-xl p-4">
      <p className="text-portal-muted text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-copper/15 text-copper'
          : 'text-portal-muted hover:text-portal-text hover:bg-portal-border/20'
      }`}
    >
      {children}
    </button>
  )
}

function ConsentsTable({ records, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-portal-border">
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Usuário</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden sm:table-cell">Tipo</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Email</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Status</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Versao</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Privacidade</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Dados</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden lg:table-cell">Marketing</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden lg:table-cell">IP</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Data</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-portal-border">
          {records.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-6 py-8 text-center text-portal-muted text-sm">
                Nenhum usuário cadastrado.
              </td>
            </tr>
          ) : (
            records.map((r) => {
              const details = r.consent_details || {}
              return (
                <tr key={r.user_id} className="hover:bg-portal-border/10 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-portal-text text-sm font-medium">{r.company_name || r.name}</p>
                    {r.company_name && <p className="text-portal-muted text-xs">{r.name}</p>}
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.role === 'admin'
                        ? 'bg-copper/15 text-copper'
                        : 'bg-portal-border/30 text-portal-muted'
                    }`}>
                      {ROLE_LABELS[r.role] || r.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-portal-muted text-sm hidden md:table-cell">{r.email}</td>
                  <td className="px-6 py-4">
                    {r.lgpd_consent_at ? (
                      <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Aceito
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-warning text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-portal-muted text-xs hidden md:table-cell">
                    {r.lgpd_consent_version || '—'}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <ConsentBadge value={details.privacy_policy} />
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <ConsentBadge value={details.data_processing} />
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <ConsentBadge value={details.marketing} optional />
                  </td>
                  <td className="px-6 py-4 text-portal-muted text-xs hidden lg:table-cell">
                    {r.consent_ip || '—'}
                  </td>
                  <td className="px-6 py-4 text-portal-muted text-xs">
                    {r.lgpd_consent_at
                      ? new Date(r.lgpd_consent_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

function ConsentBadge({ value, optional }) {
  if (value === undefined || value === null) {
    return <span className="text-portal-muted text-xs">—</span>
  }
  if (value) {
    return <span className="text-success text-xs font-medium">Sim</span>
  }
  return <span className={`${optional ? 'text-portal-muted' : 'text-danger'} text-xs font-medium`}>Não</span>
}

function AuditTable({ audit, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-portal-border">
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Data</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Usuário</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider">Ação</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">Detalhes</th>
            <th className="text-left px-6 py-3 text-xs font-medium text-portal-muted uppercase tracking-wider hidden md:table-cell">IP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-portal-border">
          {audit.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-portal-muted text-sm">
                Nenhum registro de auditoria.
              </td>
            </tr>
          ) : (
            audit.map((a) => (
              <tr key={a.id} className="hover:bg-portal-border/10 transition-colors">
                <td className="px-6 py-4 text-portal-muted text-xs whitespace-nowrap">
                  {new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-6 py-4">
                  <p className="text-portal-text text-sm">{a.user_name || '—'}</p>
                  <p className="text-portal-muted text-xs">{a.user_email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium text-copper">
                    {ACTION_LABELS[a.action] || a.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-portal-muted text-xs hidden md:table-cell max-w-xs truncate">
                  {a.details ? formatDetails(a.details) : '—'}
                </td>
                <td className="px-6 py-4 text-portal-muted text-xs hidden md:table-cell">
                  {a.ip_address || '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function formatDetails(details) {
  if (typeof details === 'string') {
    try { details = JSON.parse(details) } catch { return details }
  }
  const parts = []
  if (details.version) parts.push(`v${details.version}`)
  if (details.privacy_policy) parts.push('Privacidade')
  if (details.data_processing) parts.push('Dados')
  if (details.marketing) parts.push('Marketing')
  return parts.join(' | ') || JSON.stringify(details)
}
