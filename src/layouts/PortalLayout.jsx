import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/portal/Sidebar.jsx'
import TopBar from '../components/portal/TopBar.jsx'
import ImpersonationBanner from '../components/portal/ImpersonationBanner.jsx'
import { useUpdateAvailable } from '../hooks/useUpdateAvailable.js'

export default function PortalLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { updateAvailable, updateApp } = useUpdateAvailable()

  return (
    <div className="min-h-screen bg-portal-bg text-portal-text">
      <ImpersonationBanner />

      {updateAvailable && (
        <div className="bg-copper text-stone-950 text-center text-sm font-medium py-2 px-4 flex items-center justify-center gap-3 z-50">
          <span>Nova versão disponível</span>
          <button
            onClick={updateApp}
            className="bg-stone-950 text-copper px-3 py-0.5 rounded-md text-xs font-bold hover:bg-stone-800 transition-colors"
          >
            Atualizar agora
          </button>
        </div>
      )}

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
