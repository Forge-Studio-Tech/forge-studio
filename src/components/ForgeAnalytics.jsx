import { useEffect, useRef } from 'react'

/**
 * Componente de tracking Google Analytics para sites de clientes da Forge Studio.
 *
 * Uso: <ForgeAnalytics measurementId="G-XXXXXXX" sections={['hero', 'services', 'portfolio', 'faq', 'cta']} />
 *
 * - Injeta gtag.js com o Measurement ID
 * - Tracked scroll depth por seção via IntersectionObserver + evento GA4 'section_view'
 * - Cada seção é identificada pelo id do elemento HTML
 */
export default function ForgeAnalytics({ measurementId, sections = [] }) {
  const viewedRef = useRef(new Set())

  // Injeta gtag.js
  useEffect(() => {
    if (!measurementId) return

    // Evita duplicar se já carregou
    if (document.querySelector(`script[src*="${measurementId}"]`)) return

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    function gtag() { window.dataLayer.push(arguments) }
    window.gtag = gtag
    gtag('js', new Date())
    gtag('config', measurementId)
  }, [measurementId])

  // Scroll depth tracking por seção
  useEffect(() => {
    if (!measurementId || sections.length === 0) return
    if (!window.gtag) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current.has(entry.target.id)) {
            viewedRef.current.add(entry.target.id)
            window.gtag('event', 'section_view', {
              section_name: entry.target.id,
            })
          }
        }
      },
      { threshold: 0.5 }
    )

    for (const sectionId of sections) {
      const el = document.getElementById(sectionId)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [measurementId, sections])

  return null
}
