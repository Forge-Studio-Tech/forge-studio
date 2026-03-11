const testimonials = [
  {
    quote: 'Ficou exatamente o que eu queria. O site ficou lindo, rápido, e já recebi reservas por lá na primeira semana.',
    name: 'Vanderlei Henrique',
    role: 'Chácara Família Real · Avaré/SP',
    initials: 'VH',
  },
]

export default function Testimonials() {
  if (testimonials.length === 0) return null

  return (
    <section className="px-6 md:px-12 lg:px-20 py-24 border-t border-stone-800">
      <div className="max-w-5xl">
        <p className="text-amber-600 text-sm font-semibold tracking-[0.2em] uppercase mb-3">Depoimentos</p>
        <h2 className="text-3xl md:text-5xl font-black text-stone-100 mb-16 leading-tight">
          O que dizem os clientes
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-stone-900 border border-stone-800 p-8">
              <p className="text-4xl text-amber-600 font-black leading-none mb-4">"</p>
              <p className="text-stone-300 text-base leading-relaxed mb-8 italic">
                {t.quote}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-stone-950 font-bold text-sm shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="text-stone-100 font-semibold text-sm">{t.name}</p>
                  <p className="text-stone-500 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
