import { useState } from 'react'

const faqs = [
  {
    q: 'Quanto tempo leva para o meu site ficar pronto?',
    a: 'Landing Pages ficam prontas em até 5 dias úteis após o alinhamento inicial. Sites Institucionais levam até 10 dias úteis, dependendo da complexidade.',
  },
  {
    q: 'Preciso ter domínio e hospedagem antes de contratar?',
    a: 'Não. A gente cuida de tudo. O primeiro ano de domínio .com.br está incluso na criação. A hospedagem pode ser incluída no plano mensal ou gerenciada separadamente.',
  },
  {
    q: 'Posso pedir alterações depois que o site ficar pronto?',
    a: 'Sim! Temos planos de manutenção mensal com pacotes de alterações. Mudanças de texto, imagem, telefone, novas seções — tudo com prazo garantido.',
  },
  {
    q: 'Vocês fazem sites para qualquer segmento?',
    a: 'Sim. Já entregamos para turismo, fitness e outros segmentos. Se o seu negócio precisa de presença digital, a gente tem a solução certa.',
  },
  {
    q: 'Como funciona o pagamento?',
    a: '50% no início do projeto e 50% na entrega. Tudo via Pix, sem burocracia.',
  },
  {
    q: 'O site funciona bem no celular?',
    a: 'Sempre. Todos os projetos são desenvolvidos com foco em celular e testados em diferentes tamanhos de tela antes da entrega.',
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-stone-800">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="text-stone-200 font-medium text-sm md:text-base group-hover:text-copper transition-colors">
          {q}
        </span>
        <span className={`shrink-0 text-copper transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </span>
      </button>
      {open && (
        <p className="text-stone-400 text-sm leading-relaxed pb-5">{a}</p>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <section id="faq" className="px-6 md:px-12 lg:px-20 py-24 border-t border-stone-800">
      <div className="max-w-3xl mx-auto">
        <p className="text-copper text-sm font-semibold tracking-[0.2em] uppercase mb-3">FAQ</p>
        <h2 className="text-3xl md:text-5xl font-black text-stone-100 mb-16 leading-tight">
          Dúvidas frequentes
        </h2>
        <div>
          {faqs.map((f, i) => (
            <FAQItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  )
}
