import { useAuth } from '../../lib/auth.jsx'

export default function TopBar({ onMenuClick }) {
  const { user } = useAuth()

  return (
    <header className="h-16 border-b border-portal-border bg-portal-surface/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-portal-muted hover:text-portal-text transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <div className="lg:block hidden" />

      {/* User info */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-portal-text truncate max-w-[120px] sm:max-w-none">{user?.name}</p>
          <p className="text-xs text-portal-muted capitalize hidden sm:block">{user?.role}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-copper/20 flex items-center justify-center text-copper font-bold text-sm">
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      </div>
    </header>
  )
}
