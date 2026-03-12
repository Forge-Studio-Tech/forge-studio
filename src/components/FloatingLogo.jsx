import { useEffect, useRef, useState } from 'react'

// Anima o logo do Hero para o Navbar enquanto o usuário scrolla.
// Técnica: logo fixo (position: fixed) que interpola posição e tamanho
// via transform — GPU-accelerated, sem reflow.
// Só ativo em mobile (< 768px).

const TRANSITION_PX = 180  // scroll necessário pra completar a animação

function easeOut(t) {
  return 1 - Math.pow(1 - t, 2)
}

export default function FloatingLogo({ heroLogoRef, navLogoRef }) {
  const [style, setStyle] = useState({ display: 'none' })
  const initialHeroRect = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const isMobile = () => window.innerWidth < 768

    // Captura a posição inicial do logo no Hero (deve ser chamado com scrollY ≈ 0)
    const captureInitial = () => {
      if (!heroLogoRef.current) return
      const rect = heroLogoRef.current.getBoundingClientRect()
      initialHeroRect.current = {
        left: rect.left,
        top: rect.top,
        height: rect.height,
        width: rect.width,
      }
    }

    const update = () => {
      if (!isMobile()) {
        setStyle({ display: 'none' })
        return
      }

      if (!initialHeroRect.current) captureInitial()

      const from = initialHeroRect.current
      const navEl = navLogoRef.current
      if (!from || !navEl) return

      const navRect = navEl.getBoundingClientRect()
      const scrollY = window.scrollY
      const raw = Math.min(1, Math.max(0, scrollY / TRANSITION_PX))
      const progress = easeOut(raw)

      // Deslocamento a partir da posição inicial do Hero
      const dx = (navRect.left - from.left) * progress
      const dy = (navRect.top - from.top) * progress
      const h  = from.height + (navRect.height - from.height) * progress

      // Opacidade: fica em 1 até 75% do caminho, depois faz fade-out
      const opacity = raw > 0.75 ? 1 - (raw - 0.75) / 0.25 : 1

      setStyle({
        display: 'block',
        position: 'fixed',
        left:   `${from.left}px`,
        top:    `${from.top}px`,
        height: `${h}px`,
        width:  'auto',
        transform: `translate(${dx}px, ${dy}px)`,
        opacity,
        pointerEvents: 'none',
        zIndex: 60,
        willChange: 'transform, opacity, height',
      })
    }

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    }

    const onResize = () => {
      initialHeroRect.current = null
      setTimeout(() => { captureInitial(); update() }, 50)
    }

    // Aguarda o layout estabilizar antes da captura inicial
    const timer = setTimeout(() => { captureInitial(); update() }, 80)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [heroLogoRef, navLogoRef])

  return (
    <img
      src="/ForgeLogo.png"
      alt=""
      aria-hidden="true"
      style={style}
    />
  )
}
