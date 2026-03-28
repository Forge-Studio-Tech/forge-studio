import { Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import PortalLayout from './layouts/PortalLayout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/portal/Dashboard.jsx'
import AdminDashboard from './pages/portal/AdminDashboard.jsx'
import Projects from './pages/portal/Projects.jsx'
import ProjectDetail from './pages/portal/ProjectDetail.jsx'
import Billing from './pages/portal/Billing.jsx'
import Settings from './pages/portal/Settings.jsx'
import AdminClients from './pages/portal/admin/Clients.jsx'
import ClientDetail from './pages/portal/admin/ClientDetail.jsx'
import AdminPlans from './pages/portal/admin/Plans.jsx'
import AdminLgpd from './pages/portal/admin/Lgpd.jsx'
import PlanTemplates from './pages/portal/admin/PlanTemplates.jsx'
import DashboardMRR from './pages/portal/admin/DashboardMRR.jsx'
import Monitoring from './pages/portal/admin/Monitoring.jsx'
import ClientMonitoring from './pages/portal/Monitoring.jsx'
import Tickets from './pages/portal/Tickets.jsx'
import TicketDetail from './pages/portal/TicketDetail.jsx'
import LgpdConsent from './pages/portal/LgpdConsent.jsx'
import ForcePasswordChange from './pages/portal/ForcePasswordChange.jsx'
import { AuthProvider } from './lib/auth.jsx'
import ProtectedRoute from './lib/ProtectedRoute.jsx'

export default function AppRouter() {
  return (
    <AuthProvider>
      <Routes>
        {/* Site publico — componente original intacto */}
        <Route path="/" element={<App />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Troca de senha obrigatoria — full page, sem layout do portal */}
        <Route
          path="/portal/change-password"
          element={
            <ProtectedRoute>
              <ForcePasswordChange />
            </ProtectedRoute>
          }
        />

        {/* LGPD consent — full page, sem layout do portal */}
        <Route
          path="/portal/lgpd"
          element={
            <ProtectedRoute>
              <LgpdConsent />
            </ProtectedRoute>
          }
        />

        {/* Portal — area logada */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute>
              <PortalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="billing" element={<Billing />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="monitoring" element={<ClientMonitoring />} />
          <Route path="settings" element={<Settings />} />

          {/* Admin only */}
          <Route path="admin/clients" element={<AdminClients />} />
          <Route path="admin/clients/:id" element={<ClientDetail />} />
          <Route path="admin/plans" element={<AdminPlans />} />
          <Route path="admin/plan-templates" element={<PlanTemplates />} />
          <Route path="admin/lgpd" element={<AdminLgpd />} />
          <Route path="admin/dashboard-mrr" element={<DashboardMRR />} />
          <Route path="admin/monitoring" element={<Monitoring />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
