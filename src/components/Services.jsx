import { useState } from 'react'

const services = [
  {
    step: '01',
    title: 'Criação',
    subtitle: 'Seu projeto do zero',
    price: 'A partir de R$ 990',
    description: 'Landing Pages e Sites Institucionais feitos sob medida. Design responsivo, integração com WhatsApp e otimização para Google.',
    details: {
      title: 'Criação de Sites e Landing Pages',
      categories: [
        {
          name: 'Landing Pages',
          items: [
            { tier: 'Essencial', price: 'R$ 990', features: ['Até 5 seções', 'Design responsivo', 'Formulário de contato', 'Integração WhatsApp'] },
            { tier: 'Profissional', price: 'R$ 1.390', features: ['Até 8 seções', 'Formulário avançado', 'Animações', 'SEO básico', 'Redes sociais'] },
            { tier: 'Premium', price: 'R$ 1.990', features: ['Seções ilimitadas', 'Design personalizado', 'Animações avançadas', 'Google Analytics', 'SEO completo'] },
          ],
          note: 'Prazo: 5 a 10 dias úteis após aprovação do briefing.',
        },
        {
          name: 'Sites Institucionais',
          items: [
            { tier: 'Essencial', price: 'R$ 1.500', features: ['Até 5 páginas', 'Design responsivo', 'Formulário de contato', 'Mapa de localização'] },
            { tier: 'Profissional', price: 'R$ 2.500', features: ['Até 10 páginas', 'Blog integrado', 'SEO completo', 'Google Analytics', 'Galeria de fotos'] },
            { tier: 'Premium', price: 'R$ 4.000', features: ['Páginas ilimitadas', 'Painel administrativo', 'Blog', 'Chat online', 'Integrações avançadas'] },
          ],
          note: 'Prazo: 15 a 30 dias úteis após aprovação do briefing.',
        },
      ],
      payment: '50% na aprovação do briefing + 50% na entrega.',
    },
  },
  {
    step: '02',
    title: 'Hospedagem',
    subtitle: 'Sempre no ar',
    price: 'A partir de R$ 150/mês',
    description: 'Domínio .com.br incluso no 1º ano, certificado SSL, suporte por WhatsApp e monitoramento de disponibilidade.',
    details: {
      title: 'Hospedagem e Disponibilidade',
      categories: [
        {
          name: 'Planos mensais',
          items: [
            { tier: 'Básico', price: 'R$ 150/mês', features: ['Domínio .com.br', 'Hospedagem', 'Certificado SSL', 'Suporte por WhatsApp'] },
            { tier: 'Intermediário', price: 'R$ 200/mês', features: ['Tudo do Básico', 'Backup semanal', 'Monitoramento de disponibilidade'] },
            { tier: 'Completo', price: 'R$ 300/mês', features: ['Tudo do Intermediário', 'Backup diário', 'Relatório mensal de acessos', 'Prioridade no suporte'] },
          ],
          note: 'Primeiro ano de domínio .com.br incluso na criação.',
        },
      ],
      payment: 'Cobrança mensal via Pix.',
    },
  },
  {
    step: '03',
    title: 'Alterações',
    subtitle: 'Sempre atualizado',
    optional: true,
    price: 'A partir de R$ 100',
    description: 'Pacotes de alterações mensais para manter seu site sempre atual. Textos, imagens, novas seções e funcionalidades.',
    details: {
      title: 'Manutenção Mensal',
      categories: [
        {
          name: 'Pacotes de alterações',
          items: [
            { tier: 'Leve', price: 'R$ 100', features: ['Até 3 alterações simples', 'Textos, imagens, telefones'] },
            { tier: 'Padrão', price: 'R$ 200', features: ['Até 6 alterações', 'Ajustes de layout', 'Novas seções simples'] },
            { tier: 'Completa', price: 'R$ 350', features: ['Até 12 alterações', 'Novas páginas', 'Funcionalidades', 'Redesign de seções'] },
          ],
          note: 'Alterações não utilizadas não acumulam para o mês seguinte.',
        },
      ],
      alterations: [
        'Trocar texto, imagem ou telefone = 1 alteração',
        'Adicionar/remover seção inteira = 2 alterações',
        'Criar nova página = 3 alterações',
      ],
      payment: 'Cobrança mensal via Pix.',
    },
  },
]

export default function Services() {
  const [activeModal, setActiveModal] = useState(null)

  return (
    <section id="servicos" className="px-6 md:px-12 lg:px-20 py-24 border-t border-stone-800">
      <div className="max-w-6xl mx-auto">
        <p className="text-copper text-sm font-semibold tracking-[0.2em] uppercase mb-3">Como funciona</p>
        <h2 className="text-3xl md:text-5xl font-black text-stone-100 mb-6 leading-tight">
          Do briefing ao ar<br />em três etapas.
        </h2>
        <p className="text-stone-400 text-lg mb-16 max-w-2xl">
          Um processo simples e transparente. Você sabe exatamente o que está contratando em cada fase.
        </p>

        {/* Cards com setas */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 md:gap-0 items-stretch">
          {services.map((s, i) => (
            <>
              {/* Card */}
              <button
                key={s.step}
                onClick={() => setActiveModal(i)}
                className="bg-portal-surface border border-stone-800 hover:border-copper/40 rounded-xl p-6 md:p-8 text-left transition-all duration-300 group cursor-pointer flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-copper text-xs font-bold tracking-widest">{s.step}</span>
                  <div className="h-px flex-1 bg-stone-800 group-hover:bg-copper/30 transition-colors" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-stone-100 mb-1 group-hover:text-copper transition-colors">
                  {s.title}
                  {s.optional && (
                    <span className="text-stone-500 text-xs font-normal ml-2">opcional</span>
                  )}
                </h3>
                <p className="text-copper text-sm font-medium mb-4">{s.subtitle}</p>
                <p className="text-stone-400 text-sm leading-relaxed mb-6 flex-1">{s.description}</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-stone-100 font-bold text-lg whitespace-nowrap">{s.price}</span>
                  <span className="text-copper text-xs font-medium whitespace-nowrap group-hover:translate-x-1 transition-transform">
                    Ver detalhes →
                  </span>
                </div>
              </button>

              {/* Seta entre cards (desktop) */}
              {i < services.length - 1 && (
                <div className="hidden md:flex items-center justify-center px-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D5851E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              )}

              {/* Seta entre cards (mobile) */}
              {i < services.length - 1 && (
                <div className="flex md:hidden justify-center -my-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D5851E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 rotate-90">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </>
          ))}
        </div>
      </div>

      {/* Modal de detalhes */}
      {activeModal !== null && (
        <ServiceModal
          service={services[activeModal]}
          onClose={() => setActiveModal(null)}
        />
      )}
    </section>
  )
}

function ServiceModal({ service, onClose }) {
  const { details } = service

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-stone-950 border border-stone-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800">
          <h3 className="text-xl font-bold text-stone-100">{details.title}</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">
          {details.categories.map((cat) => (
            <div key={cat.name}>
              <h4 className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-4">{cat.name}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {cat.items.map((item) => (
                  <div key={item.tier} className="border border-stone-800 rounded-lg p-5 hover:border-copper/30 transition-colors">
                    <p className="text-stone-100 font-bold text-sm mb-1">{item.tier}</p>
                    <p className="text-copper font-bold text-lg mb-4">{item.price}</p>
                    <ul className="space-y-2">
                      {item.features.map((f, i) => (
                        <li key={i} className="text-stone-400 text-xs flex items-start gap-2">
                          <span className="text-copper mt-0.5 shrink-0">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {cat.note && (
                <p className="text-stone-500 text-xs mt-3">{cat.note}</p>
              )}
            </div>
          ))}

          {/* Tabela de alterações (só manutenção) */}
          {details.alterations && (
            <div>
              <h4 className="text-stone-400 text-xs font-semibold uppercase tracking-widest mb-3">O que conta como alteração?</h4>
              <ul className="space-y-1.5">
                {details.alterations.map((a, i) => (
                  <li key={i} className="text-stone-400 text-xs flex items-start gap-2">
                    <span className="text-copper shrink-0">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pagamento */}
          <div className="flex items-center gap-3 pt-4 border-t border-stone-800">
            <span className="text-copper text-sm">💳</span>
            <p className="text-stone-400 text-sm">{details.payment}</p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-6 border-t border-stone-800">
          <a
            href="https://wa.me/5514996936966?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20Forge%20Studio%20e%20gostaria%20de%20um%20or%C3%A7amento."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-3 bg-copper hover:bg-copper-dark text-stone-950 font-bold text-sm px-6 py-3 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Solicitar orçamento
          </a>
        </div>
      </div>
    </div>
  )
}
