# Google Analytics no Mission Control — Design Spec

> **Data:** 2026-03-28

## Objetivo

Painel de Google Analytics no portal Mission Control mostrando métricas de tráfego e comportamento dos sites dos clientes. Admin vê todos, cliente vê só o dele (se plano Completo ou toggle manual).

## Arquitetura

- **Fonte de dados:** Google Analytics 4 Data API (gratuita, 10k req/dia)
- **Auth:** Service account da Forge (uma pra todos) com acesso viewer em cada propriedade GA4
- **Backend:** Proxy Fastify → GA4 Data API com cache em memória (TTL 6h)
- **Frontend:** Card resumo no Dashboard + página dedicada `/portal/analytics` e `/portal/admin/analytics`
- **Tracking:** Componente React `<ForgeAnalytics>` com gtag.js + scroll depth por seção (IntersectionObserver + GA4 events)

## Acesso

- **Admin:** vê analytics de todos os projetos
- **Cliente com plano Completo:** vê analytics dos seus projetos
- **Cliente sem plano Completo:** não vê (a menos que `analytics_enabled = true` no projeto)
- **Toggle manual:** campo `analytics_enabled` (boolean) no projeto, controlado pelo admin. Permite cortesia.

## Campos novos no banco

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ga_property_id VARCHAR(20);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN DEFAULT false;
```

## Backend — Rotas

### GET /api/analytics
Lista resumo de analytics de todos os projetos visíveis.
- Admin: todos com `ga_property_id IS NOT NULL`
- Cliente: seus projetos com analytics habilitado (plano completo OU `analytics_enabled = true`)
- Retorna: `{ sites: [{ project_id, project_name, visitors_7d, sessions_7d, trend }] }`
- Cache: 6h por cacheKey (admin_all / client_{id})

### GET /api/analytics/:projectId?period=7d|30d|90d
Detalhe completo de um projeto.
- Valida acesso (admin ou dono + plano/toggle)
- Retorna:
  - `visitors_by_day`: array de { date, visitors, sessions }
  - `sources`: array de { source, sessions, percentage }
  - `devices`: array de { device, sessions, percentage }
  - `engagement`: { bounce_rate, avg_session_duration, avg_time_on_page }
  - `scroll_depth`: array de { section, views, percentage } (do evento customizado)

## Backend — Lib GA4

`src/lib/google-analytics.js`
- Usa `@google-analytics/data` (SDK oficial Node.js)
- Auth via service account JSON (env var `GOOGLE_SERVICE_ACCOUNT` com path pro JSON)
- Funções: `getAnalyticsSummary(propertyId, days)`, `getAnalyticsDetail(propertyId, days)`

## Frontend — Dashboard

Card expansível (mesmo padrão do monitoramento):
- **Compacto:** "Analytics — X visitantes esta semana" + sparkline
- **Expandido:** visitantes 7d, sessões, mini gráfico por dia
- Link "Ver detalhes →" para página dedicada
- Só aparece se o projeto tem analytics habilitado

## Frontend — Página dedicada

### Seções:
1. **Seletor de período:** 7d | 30d | 90d (pills/tabs)
2. **Cards resumo:** Visitantes, Sessões, Bounce Rate, Tempo Médio
3. **Gráfico de visitantes por dia:** SVG polyline (mesmo estilo do monitoramento)
4. **Fontes de tráfego:** barras horizontais (Google, Direto, Social, Referral, Outros)
5. **Dispositivos:** barras ou donut simples (Desktop, Mobile, Tablet)
6. **Scroll depth por seção:** barras horizontais mostrando % de visitantes que viram cada seção

### Admin vs Cliente:
- Admin: dropdown pra selecionar projeto (ou grid de cards como monitoramento)
- Cliente: mostra direto o(s) projeto(s) dele

## Componente de Tracking — `<ForgeAnalytics>`

Componente React reutilizável pra adicionar em cada site de cliente.

```jsx
<ForgeAnalytics measurementId="G-XXXXXXX" sections={['hero', 'services', 'portfolio', 'faq', 'cta']} />
```

**Funcionalidades:**
- Injeta script gtag.js com o Measurement ID
- Configura IntersectionObserver pra cada seção (por `id` do elemento)
- Dispara evento GA4 `section_view` com parâmetro `section_name` quando seção entra no viewport (threshold 50%)
- Debounce pra não disparar múltiplas vezes por seção por sessão

## Decisões

| Decisão | Alternativas | Motivo |
|---------|-------------|--------|
| GA4 Data API | Tracking próprio, Plausible | Gratuito, padrão do mercado, sem infra extra |
| Uma service account | Uma por cliente | Mais simples, padrão de agência |
| Cache 6h | 1h, sem cache | Analytics não é real-time, economiza quota |
| Componente React | Inject via Caddy, Tag Manager | Mais controle sobre eventos customizados de seção |
| Acesso por plano + toggle | Todos, só admin | Diferencial de plano + flexibilidade pra cortesias |
| Scroll depth via GA4 events | Tracking próprio | Centraliza tudo no GA4 |

## Não-goals

- Conversões / funil
- E-commerce tracking
- Relatórios exportáveis (PDF/CSV)
- Comparação entre períodos
- Real-time visitors
