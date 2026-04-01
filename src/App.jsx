import { useRef, useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Portfolio from './components/Portfolio'
import About from './components/About'
import Services from './components/Services'
import FAQ from './components/FAQ'
import CTA from './components/CTA'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import ForgeAnalytics from './components/ForgeAnalytics'

// Logo único que anima entre Hero e Navbar no mobile
function FloatingMobileLogo({ heroRef, navRef }) {
  const [style, setStyle] = useState({})
  const heroRect = useRef(null)

  useEffect(() => {
    const isMobile = () => window.innerWidth < 768

    const capture = () => {
      if (!heroRef.current) return
      // Medir posição do placeholder no Hero relativo ao viewport quando scroll=0
      const r = heroRef.current.getBoundingClientRect()
      heroRect.current = {
        left: r.left + window.scrollX,
        top: r.top + window.scrollY,
        height: r.height,
      }
    }

    const update = () => {
      if (!isMobile()) { setStyle({ display: 'none' }); return }
      if (!heroRect.current) capture()
      if (!heroRect.current || !navRef.current) return

      const from = heroRect.current
      const navR = navRef.current.getBoundingClientRect()
      const scrollY = window.scrollY

      // Distância de scroll necessária pra completar a transição
      const totalDist = Math.max(1, from.top - (navR.top + scrollY))
      const progress = Math.min(1, Math.max(0, scrollY / totalDist))

      // Interpolar posição e tamanho
      const top = from.top - scrollY + (navR.top - from.top + scrollY) * progress
      const left = from.left + (navR.left - from.left) * progress
      const height = from.height + (navR.height - from.height) * progress

      setStyle({
        display: 'block',
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        height: `${height}px`,
        width: 'auto',
        zIndex: 60,
        pointerEvents: 'none',
      })
    }

    const onScroll = () => requestAnimationFrame(update)
    const onResize = () => { heroRect.current = null; setTimeout(() => { capture(); update() }, 50) }

    setTimeout(() => { capture(); update() }, 100)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize) }
  }, [heroRef, navRef])

  return <img src="/ForgeLogo.png" alt="" aria-hidden="true" style={style} />
}

export default function App() {
  const heroLogoRef = useRef(null)
  const navLogoRef = useRef(null)

  return (
    <div className="bg-[#0c0a09] min-h-screen">
      <Navbar logoRef={navLogoRef} />
      <Hero logoRef={heroLogoRef} />
      <FloatingMobileLogo heroRef={heroLogoRef} navRef={navLogoRef} />
      <Portfolio />
      <About />
      <Services />
      <FAQ />
      <CTA />
      <Footer />
      <WhatsAppButton />
      <ForgeAnalytics measurementId="G-7W28TSS4V4" sections={['hero', 'portfolio', 'sobre', 'servicos', 'faq', 'cta']} />
    </div>
  )
}
