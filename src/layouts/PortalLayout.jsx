import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/portal/Sidebar.jsx'
import TopBar from '../components/portal/TopBar.jsx'

export default function PortalLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-portal-bg text-portal-text">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Conteudo principal */}
      <div
        className={`
          transition-all duration-300
          ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}
        `}
      >
        <TopBar onMenuClick={() => setMobileOpen(true)} />

        <main className="px-4 md:px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
