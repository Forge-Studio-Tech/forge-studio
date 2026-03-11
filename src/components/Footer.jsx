export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="px-6 md:px-12 lg:px-20 py-10 border-t border-stone-800">
      <div className="max-w-5xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <img src="/ForgeLogo.png" alt="Forge Studio" className="h-12 w-auto" />
        </div>
        <div className="flex flex-col md:items-end gap-1">
          <p className="text-stone-500 text-sm">
            © {year} Forge Studio. Todos os direitos reservados.
          </p>
          <a
            href="https://wa.me/5514996936966"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-500 hover:text-copper text-sm transition-colors"
          >
            (14) 99693-6966
          </a>
        </div>
      </div>
    </footer>
  )
}
