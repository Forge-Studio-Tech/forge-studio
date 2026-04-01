import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar({ logoRef, heroVisible }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 lg:px-20 py-5 flex items-center justify-between border-b border-stone-800/60 bg-stone-950/80 backdrop-blur-sm">

      {/* Logo */}
      <a
        href="#"
        className={`flex items-center gap-3 transition-opacity duration-500 ${
          heroVisible
            ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'
            : 'opacity-100 pointer-events-auto'
        }`}
      >
        <img
          ref={logoRef}
          src="/ForgeLogo.png"
          alt="Forge Studio"
          className="h-10 w-auto"
        />
        <span className="text-stone-100 font-black text-xl tracking-tight hidden sm:block">
          Forge Studio
        </span>
      </a>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-8 text-sm text-stone-400">
        <a href="#portfolio" className="hover:text-copper transition-colors">Portfólio</a>
        <a href="#sobre"     className="hover:text-copper transition-colors">Sobre</a>
        <a href="#servicos"  className="hover:text-copper transition-colors">Serviços</a>
        <a href="#faq"       className="hover:text-copper transition-colors">FAQ</a>
        <Link
          to="/login"
          className="border border-copper/40 text-copper hover:bg-copper/10 font-bold px-4 py-2 text-xs tracking-wide transition-colors rounded"
        >
          ÁREA DO CLIENTE
        </Link>
        <a
          href="https://wa.me/5514996936966"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 text-xs tracking-wide transition-colors rounded"
        >
          ORÇAMENTO
        </a>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden flex flex-col gap-1.5 p-2"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Menu"
      >
        <span className={`block w-6 h-0.5 bg-stone-300 transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-6 h-0.5 bg-stone-300 transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-6 h-0.5 bg-stone-300 transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-stone-950 border-b border-stone-800 px-6 py-6 flex flex-col gap-4 md:hidden">
          <a href="#portfolio" onClick={() => setMenuOpen(false)} className="text-stone-300 hover:text-copper transition-colors text-sm font-medium">Portfólio</a>
          <a href="#sobre" onClick={() => setMenuOpen(false)} className="text-stone-300 hover:text-copper transition-colors text-sm font-medium">Sobre</a>
          <a href="#servicos" onClick={() => setMenuOpen(false)} className="text-stone-300 hover:text-copper transition-colors text-sm font-medium">Serviços</a>
          <a href="#faq" onClick={() => setMenuOpen(false)} className="text-stone-300 hover:text-copper transition-colors text-sm font-medium">FAQ</a>
          <div className="flex gap-3 pt-3 border-t border-stone-800">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="border border-copper/40 text-copper hover:bg-copper/10 font-bold px-4 py-2.5 text-xs tracking-wide transition-colors rounded flex-1 text-center"
            >
              ÁREA DO CLIENTE
            </Link>
            <a
              href="https://wa.me/5514996936966"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2.5 text-xs tracking-wide transition-colors rounded flex-1 text-center"
            >
              ORÇAMENTO
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
