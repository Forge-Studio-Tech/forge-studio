import { useState, useEffect } from 'react'

const projects = [
  {
    name: 'Chácara Família Real',
    tag: 'Site Institucional',
    desc: 'Site completo para chácara de temporada em Avaré/SP. Galeria de fotos com 96 imagens reais, seções de comodidades, FAQ, avaliações e CTA direto para WhatsApp.',
    url: 'https://chacarafamiliareal.com.br',
    label: 'chacarafamiliareal.com.br',
    live: true,
    screenshots: [
      '/cases/chacara/Chacara_Screenshot_1.png',
      '/cases/chacara/Chacara_Screenshot_2.png',
      '/cases/chacara/Chacara_Screenshot_3.png',
      '/cases/chacara/Chacara_Screenshot_4.png',
    ],
  },
  {
    name: 'Versa Studio',
    tag: 'Landing Page',
    desc: 'Landing page para a Versa — distribuição de equipamentos de eletroestimulação neuro-muscular (EMS). Foco em apresentação de produtos e geração de leads.',
    url: 'https://versaems.com',
    label: 'versaems.com',
    live: true,
    screenshots: [
      '/cases/versa/Versa_Screenshot_1.png',
      '/cases/versa/Versa_Screenshot_2.png',
      '/cases/versa/Versa_Screenshot_3.png',
      '/cases/versa/Versa_Screenshot_4.png',
    ],
  },
]

function MiniCarousel({ images }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActive(i => (i + 1) % images.length), 3000)
    return () => clearInterval(id)
  }, [images.length])

  return (
    <div className="relative overflow-hidden rounded-sm aspect-[16/9] bg-stone-800">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-700 ${i === active ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setActive(i) }}
            className={`w-1.5 h-1.5 rounded-full transition-all ${i === active ? 'bg-white w-4' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function Portfolio() {
  return (
    <section id="portfolio" className="px-6 md:px-12 lg:px-20 py-24 border-t border-stone-800">
      <div className="max-w-5xl mx-auto">
        <p className="text-copper text-sm font-semibold tracking-[0.2em] uppercase mb-3">Portfólio</p>
        <h2 className="text-3xl md:text-5xl font-black text-stone-100 mb-16 leading-tight">
          Projetos entregues
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((p) => (
            <div
              key={p.name}
              className="bg-stone-900 border border-stone-800 overflow-hidden flex flex-col gap-5 hover:border-copper transition-colors duration-300 group"
            >
              {p.screenshots && <MiniCarousel images={p.screenshots} />}

              <div className="px-8 pb-8 flex flex-col gap-5 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-copper tracking-widest uppercase">
                      {p.tag}
                    </span>
                    <h3 className="text-xl font-bold text-stone-100 mt-1">{p.name}</h3>
                  </div>
                  {p.live ? (
                    <span className="flex items-center gap-1.5 text-xs text-lime-400 font-medium shrink-0 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <span className="text-xs text-stone-500 font-medium shrink-0 mt-1">Em breve</span>
                  )}
                </div>

                <p className="text-stone-400 text-sm leading-relaxed flex-1">{p.desc}</p>

                {p.live ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-copper hover:text-copper-dark font-medium transition-colors"
                  >
                    {p.label}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                ) : (
                  <span className="text-sm text-stone-600 font-medium">{p.label}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
