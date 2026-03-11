import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Portfolio from './components/Portfolio'
import About from './components/About'
import FAQ from './components/FAQ'
import CTA from './components/CTA'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'

export default function App() {
  return (
    <div className="bg-[#0c0a09] min-h-screen">
      <Navbar />
      <Hero />
      <Portfolio />
      <About />
      <FAQ />
      <CTA />
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
