const highlights = [
  { num: '2+', label: 'anos de experiência' },
  { num: '5+', label: 'projetos entregues' },
  { num: '100%', label: 'clientes ativos' },
]

export default function About() {
  return (
    <section id="sobre" className="px-6 md:px-12 lg:px-20 py-24 border-t border-stone-800">
      <div className="max-w-5xl grid md:grid-cols-2 gap-16 items-start">
        <div>
          <p className="text-amber-600 text-sm font-semibold tracking-[0.2em] uppercase mb-3">Sobre</p>
          <h2 className="text-3xl md:text-5xl font-black text-stone-100 mb-8 leading-tight">
            Feito com cuidado,<br />do início ao fim.
          </h2>
          <div className="flex gap-8 mb-10">
            {highlights.map((h) => (
              <div key={h.label}>
                <p className="text-3xl font-black text-amber-600">{h.num}</p>
                <p className="text-xs text-stone-500 mt-1">{h.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5 text-stone-400 leading-relaxed">
          <p>
            A <span className="text-stone-200 font-semibold">Forge Studio</span> nasceu para trazer presença digital de verdade para negócios locais.
            Não somos uma plataforma de templates — cada projeto é construído do zero, com atenção
            aos detalhes e foco em resultados.
          </p>
          <p>
            Sou o Gabriel, desenvolvedor web em Avaré/SP. Trabalho com tecnologias modernas como
            React, Vite e Tailwind para criar sites rápidos, bonitos e que funcionam de verdade —
            tanto no celular quanto no computador.
          </p>
          <p>
            Do briefing até o deploy, acompanho cada etapa pessoalmente. Sem terceirização,
            sem surpresas.
          </p>
          <div className="pt-4 border-t border-stone-800">
            <p className="text-stone-500 text-sm">
              📍 Avaré/SP &nbsp;·&nbsp; Atendimento online para todo o Brasil
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
