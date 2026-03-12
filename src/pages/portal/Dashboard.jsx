import { useAuth } from '../../lib/auth.jsx'
import { useApi } from '../../hooks/useApi.js'
import { Link } from 'react-router-dom'
import AdminDashboard from './AdminDashboard.jsx'
import StatCard from '../../components/portal/StatCard.jsx'

export default function Dashboard() {
  const { user } = useAuth()

  if (user?.role === 'admin') {
    return <AdminDashboard />
  }

  return <ClientDashboard user={user} />
}

function ClientDashboard({ user }) {
  const { data: projectsData, loading: loadingProjects } = useApi('/api/projects')
  const { data: paymentsData, loading: loadingPayments } = useApi('/api/payments')

  const projects = projectsData?.projects || []
  const payments = paymentsData?.payments || []
  const pendingPayments = payments.filter((p) => p.status === 'pending')
  const nextPayment = pendingPayments.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0]

  return (
    <div>
      <h1 className="text-2xl font-bold text-portal-text mb-1">
        Ola, {user?.name?.split(' ')[0]}
      </h1>
      <p className="text-portal-muted text-sm mb-8">
        Acompanhe seus projetos e pagamentos
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Projetos Ativos" value={loadingProjects ? '...' : String(projects.length)} />
        <StatCard
          label="Proximo Pagamento"
          value={loadingPayments ? '...' : nextPayment
            ? `R$ ${Number(nextPayment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : 'Nenhum'}
        />
        <StatCard label="Pagamentos Pendentes" value={loadingPayments ? '...' : String(pendingPayments.length)} />
      </div>

      <section>
        <h2 className="text-lg font-semibold text-portal-text mb-4">Meus Projetos</h2>
        {projects.length === 0 ? (
          <div className="bg-portal-surface border border-portal-border rounded-xl p-8 text-center">
            <p className="text-portal-muted text-sm">Nenhum projeto encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <Link
                key={p.id}
                to={`/portal/projects/${p.id}`}
                className="bg-portal-surface border border-portal-border rounded-xl p-5 hover:border-copper/40 transition-colors block"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-portal-text font-semibold text-sm">{p.name}</h3>
                  <StatusPill status={p.status} />
                </div>
                {p.production_url && (
                  <p className="text-portal-muted text-xs truncate">{p.production_url}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

const STATUS_LABELS = {
  briefing: 'Briefing', design: 'Design', development: 'Desenvolvimento',
  review: 'Revisao', published: 'Publicado', maintenance: 'Manutencao',
}
const STATUS_COLORS = {
  briefing: 'bg-portal-border/50 text-portal-muted',
  design: 'bg-warning/15 text-warning',
  development: 'bg-copper/15 text-copper',
  review: 'bg-warning/15 text-warning',
  published: 'bg-success/15 text-success',
  maintenance: 'bg-portal-border/50 text-portal-muted',
}
function StatusPill({ status }) {
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || ''}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}
