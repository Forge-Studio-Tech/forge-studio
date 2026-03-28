import { Link } from 'react-router-dom'

export default function Navbar({ logoRef, heroVisible }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 lg:px-20 py-5 flex items-center justify-between border-b border-stone-800/60 bg-stone-950/80 backdrop-blur-sm">

      {/* Logo
          Desktop: sempre visível.
          Mobile: invisível enquanto Hero está na tela (FloatingLogo cobre),
                  aparece com fade-in quando Hero sai. */}
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
          AREA DO CLIENTE
        </Link>
        <a
          href="https://wa.me/5514996936966"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 text-xs tracking-wide transition-colors rounded"
        >
          ORCAMENTO
        </a>
      </div>

      {/* Mobile nav — seções à direita */}
      <div className="flex md:hidden items-center gap-5 text-sm font-medium text-stone-400">
        <a href="#portfolio" className="hover:text-copper transition-colors">Portfólio</a>
        <a href="#sobre"     className="hover:text-copper transition-colors">Sobre</a>
        <a href="#servicos"  className="hover:text-copper transition-colors">Serviços</a>
        <a href="#faq"       className="hover:text-copper transition-colors">FAQ</a>
      </div>

    </nav>
  )
}
