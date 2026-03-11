export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 lg:px-20 py-5 flex items-center justify-between border-b border-stone-800/60 bg-stone-950/80 backdrop-blur-sm">
      <a href="#" className="text-stone-100 font-black text-base tracking-tight">
        FORGE <span className="text-copper">STUDIO</span>
      </a>
      <div className="hidden md:flex items-center gap-8 text-sm text-stone-400">
        <a href="#portfolio" className="hover:text-cyan-400 transition-colors">Portfólio</a>
        <a href="#sobre" className="hover:text-cyan-400 transition-colors">Sobre</a>
        <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
        <a
          href="https://wa.me/5514996936966"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-copper hover:bg-copper-dark text-stone-950 font-bold px-4 py-2 text-xs tracking-wide transition-colors"
        >
          ORÇAMENTO
        </a>
      </div>
    </nav>
  )
}
