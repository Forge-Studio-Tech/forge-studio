import { useRef, useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Portfolio from './components/Portfolio'
import About from './components/About'
import FAQ from './components/FAQ'
import CTA from './components/CTA'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import FloatingLogo from './components/FloatingLogo'
import ForgeAnalytics from './components/ForgeAnalytics'

export default function App() {
  // Refs para os dois "âncoras" do logo — placeholder no Hero e logo no Navbar
  const heroLogoRef = useRef(null)
  const navLogoRef  = useRef(null)

  // heroVisible controla visibilidade do logo no Navbar (compartilhado com Navbar e FloatingLogo)
  const [heroVisible, setHeroVisible] = useState(true)

  useEffect(() => {
    const hero = document.getElementById('hero')
    if (!hero) return
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="bg-[#0c0a09] min-h-screen">
      <Navbar logoRef={navLogoRef} heroVisible={heroVisible} />
      <Hero logoRef={heroLogoRef} />
      <Portfolio />
      <About />
      <FAQ />
      <CTA />
      <Footer />
      <WhatsAppButton />
      {/* Logo flutuante — anima entre Hero e Navbar no mobile */}
      <FloatingLogo heroLogoRef={heroLogoRef} navLogoRef={navLogoRef} />
      <ForgeAnalytics measurementId="G-7W28TSS4V4" sections={['hero', 'portfolio', 'sobre', 'faq', 'cta']} />
    </div>
  )
}
