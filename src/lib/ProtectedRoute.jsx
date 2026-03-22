import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-portal-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-copper border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Forcar troca de senha temporaria (prioridade sobre LGPD)
  if (user.must_change_password && location.pathname !== '/portal/change-password') {
    return <Navigate to="/portal/change-password" replace />
  }

  // Redirecionar para tela LGPD se consentimento pendente (so apos trocar senha)
  if (!user.must_change_password && !user.lgpd_consent_at && location.pathname !== '/portal/lgpd') {
    return <Navigate to="/portal/lgpd" replace />
  }

  return children
}
