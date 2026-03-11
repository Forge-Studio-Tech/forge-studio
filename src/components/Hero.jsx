const WA_LINK = 'https://wa.me/5514996936966?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20Forge%20Studio%20e%20gostaria%20de%20um%20or%C3%A7amento.'

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-20 pt-24 pb-16 relative overflow-hidden">
      {/* Linha vertical de detalhe */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-amber-600 to-transparent opacity-60" />

      {/* Conteúdo */}
      <div className="max-w-4xl">
        <p className="text-amber-600 text-sm font-semibold tracking-[0.2em] uppercase mb-6">
          Agência Digital
        </p>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight text-stone-100 mb-8">
          Sites que<br />
          <span className="text-amber-600">vendem.</span><br />
          Entrega que<br />
          impressiona.
        </h1>

        <p className="text-lg md:text-xl text-stone-400 max-w-xl leading-relaxed mb-10">
          Criamos Landing Pages e Sites Institucionais para negócios de qualquer
          segmento. Da ideia ao ar em tempo recorde.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold text-base px-8 py-4 transition-colors duration-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Falar no WhatsApp
          </a>
          <a
            href="#portfolio"
            className="inline-flex items-center justify-center gap-2 border border-stone-700 hover:border-amber-600 text-stone-300 hover:text-amber-600 font-medium text-base px-8 py-4 transition-colors duration-200"
          >
            Ver portfólio
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Detalhe de fundo — número discreto */}
      <div className="absolute right-8 bottom-12 text-[120px] md:text-[200px] font-black text-stone-900 select-none pointer-events-none leading-none opacity-40">
        FS
      </div>
    </section>
  )
}
