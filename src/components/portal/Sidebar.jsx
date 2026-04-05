import { NavLink } from 'react-router-dom'
import { useAuth } from '../../lib/auth.jsx'
import { useUnreadMessages } from '../../hooks/useUnreadMessages.js'

const clientLinks = [
  { to: '/portal', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/portal/projects', label: 'Projetos', icon: FolderIcon },
  { to: '/portal/billing', label: 'Financeiro', icon: DollarIcon },
  { to: '/portal/monitoring', label: 'Monitoramento', icon: SignalIcon },
  { to: '/portal/analytics', label: 'Analytics', icon: BarChartIcon },
  { to: '/portal/tickets', label: 'Solicitações', icon: TicketIcon },
  { to: '/portal/settings', label: 'Configurações', icon: GearIcon },
]

const adminMainLinks = [
  { to: '/portal', label: 'Mission Control', icon: HomeIcon, end: true },
  { to: '/portal/admin/clients', label: 'Clientes', icon: UsersIcon },
  { to: '/portal/projects', label: 'Projetos', icon: FolderIcon },
  { to: '/portal/admin/plans', label: 'Planos', icon: TagIcon },
  { to: '/portal/billing', label: 'Financeiro', icon: DollarIcon },
  { to: '/portal/admin/monitoring', label: 'Monitoramento', icon: SignalIcon },
  { to: '/portal/admin/analytics', label: 'Analytics', icon: BarChartIcon },
  { to: '/portal/admin/messages', label: 'Mensagens', icon: ChatIcon },
  { to: '/portal/tickets', label: 'Solicitações', icon: TicketIcon },
  { to: '/portal/settings', label: 'Configurações', icon: GearIcon },
]

const adminSectionLinks = [
  { to: '/portal/admin/dashboard-mrr', label: 'Dashboard MRR', icon: ChartIcon },
  { to: '/portal/admin/leads', label: 'Leads', icon: UsersIcon },
  { to: '/portal/admin/whatsapp', label: 'WhatsApp', icon: ChatIcon },
  { to: '/portal/admin/plan-templates', label: 'Tipos de Plano', icon: CubeIcon },
  { to: '/portal/admin/lgpd', label: 'LGPD', icon: ShieldIcon },
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user, logout, impersonating } = useAuth()
  const isAdmin = user?.role === 'admin' && !impersonating
  const mainLinks = isAdmin ? adminMainLinks : clientLinks
  const { count: unreadCount } = useUnreadMessages({ enabled: isAdmin })

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
          fixed left-0 z-50 flex flex-col
          bg-portal-surface border-r border-portal-border
          transition-all duration-300 ease-in-out
          ${impersonating ? 'top-10 h-[calc(100%-2.5rem)]' : 'top-0 h-full'}
          ${collapsed ? 'w-16' : 'w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-portal-border shrink-0">
          <img src="/ForgeLogo.png" alt="Forge" className="h-8 w-8 shrink-0" />
          {!collapsed && (
            <span className="text-portal-text font-bold text-sm truncate">
              Forge Studio
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {mainLinks.map((link) => (
            <SidebarLink
              key={link.to}
              link={link}
              collapsed={collapsed}
              onClick={onMobileClose}
              badge={link.to === '/portal/admin/messages' && unreadCount > 0 ? unreadCount : null}
            />
          ))}

          {/* Seção Administração — só admin */}
          {isAdmin && (
            <>
              <div className="mx-4 my-3 border-t border-portal-border" />
              {!collapsed && (
                <p className="px-4 mb-1 text-[10px] font-semibold text-portal-muted uppercase tracking-widest">
                  Administração
                </p>
              )}
              {adminSectionLinks.map((link) => (
                <SidebarLink key={link.to} link={link} collapsed={collapsed} onClick={onMobileClose} />
              ))}
            </>
          )}
        </nav>

        {/* Footer — user info */}
        <div className="border-t border-portal-border px-4 py-3 shrink-0">
          {!collapsed && (
            <div className="mb-2">
              <p className="text-portal-text text-sm font-medium truncate">{user?.name}</p>
              <p className="text-portal-muted text-xs truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 text-portal-muted hover:text-danger text-sm transition-colors w-full"
          >
            <LogoutIcon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>

        {/* Toggle collapse — desktop only */}
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center h-8 border-t border-portal-border text-portal-muted hover:text-portal-text transition-colors"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          <ChevronIcon className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>
    </>
  )
}

function SidebarLink({ link, collapsed, onClick, badge }) {
  return (
    <NavLink
      to={link.to}
      end={link.end}
      onClick={onClick}
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm
        transition-colors duration-200 relative
        ${isActive
          ? 'bg-copper/10 text-copper font-semibold'
          : 'text-portal-muted hover:text-portal-text hover:bg-portal-border/30'
        }
      `}
    >
      <span className="relative shrink-0">
        <link.icon className="w-5 h-5" />
        {badge != null && collapsed && (
          <span className="absolute -top-1.5 -right-1.5 bg-danger text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      {!collapsed && (
        <>
          <span className="truncate flex-1">{link.label}</span>
          {badge != null && (
            <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

/* ── Icones inline (SVG simples, sem dependencia externa) ── */

function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function FolderIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  )
}

function DollarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function GearIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function TagIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  )
}

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

function LogoutIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  )
}

function CubeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  )
}

function TicketIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
    </svg>
  )
}

function ChartIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function SignalIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

function BarChartIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function ChatIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443h2.387c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  )
}

function ChevronIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  )
}
