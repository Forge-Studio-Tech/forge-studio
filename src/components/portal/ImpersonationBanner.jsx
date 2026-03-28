import { useAuth } from '../../lib/auth.jsx'
import { useNavigate } from 'react-router-dom'

export default function ImpersonationBanner() {
  const { impersonating, user, adminName, stopImpersonation } = useAuth()
  const navigate = useNavigate()

  if (!impersonating) return null

  async function handleStop() {
    await stopImpersonation()
    navigate('/portal')
  }

  return (
    <div className="bg-copper text-stone-950 px-4 py-2 flex items-center justify-between text-sm font-medium z-[60] relative">
      <div className="flex items-center gap-2">
        <EyeIcon className="w-4 h-4" />
        <span>
          Visualizando como <strong>{user?.name}</strong>
          {adminName && <span className="opacity-70"> — logado como {adminName}</span>}
        </span>
      </div>
      <button
        onClick={handleStop}
        className="bg-stone-950/20 hover:bg-stone-950/30 text-stone-950 px-3 py-1 rounded-md text-xs font-bold transition-colors"
      >
        Voltar ao Admin
      </button>
    </div>
  )
}

function EyeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
