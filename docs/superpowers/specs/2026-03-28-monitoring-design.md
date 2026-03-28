# Spec: Monitor de Disponibilidade de Sites

> Data: 2026-03-28
> Projeto: Mission Control — Forge Studio

---

## Objetivo

Dashboard no portal mostrando status up/down dos sites dos clientes. Admin vê todos, cliente vê só o seu. Integrado com Zabbix (já configurado na VPS) para puxar dados de monitoramento.

## Decisões de Design

| Decisão | Escolha |
|---------|---------|
| Tipo de monitoramento | Simples: up/down + tempo de resposta |
| Fonte de URLs | Campo `site_url` dos projetos (já existente) |
| Navegação | Card resumo no Dashboard + página dedicada |
| Frequência de consulta | Cache em memória no backend (TTL 2 min) |
| Setup de web scenarios | Já criados manualmente no Zabbix. Novos projetos: criação automática |

---

## Zabbix — Estado Atual

Web scenarios já configurados no grupo "Websites":

| Host | hostid | URL | Intervalo |
|------|--------|-----|-----------|
| versaems.com | 10776 | https://versaems.com | 1 min |
| forgestudio.tech | 10779 | http://127.0.0.1:80 | 1 min |
| cadu.forgestudio.tech | 10780 | https://cadu.forgestudio.tech | 1 min |
| chacarafamiliareal.com.br | 10781 | https://chacarafamiliareal.com.br | 1 min |

API: `https://zabbix.forgestudio.tech/api_jsonrpc.php`
Auth: JSON-RPC via header `Authorization: Bearer <token>`

---

## Database

### Migration

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS zabbix_host_id VARCHAR(20);
```

### Setup inicial — popular projetos existentes

UPDATE manual para vincular hostids do Zabbix aos projetos que já têm web scenarios. Exemplo:

```sql
UPDATE projects SET zabbix_host_id = '10776' WHERE site_url LIKE '%versaems.com%';
UPDATE projects SET zabbix_host_id = '10780' WHERE site_url LIKE '%cadu.forgestudio%';
UPDATE projects SET zabbix_host_id = '10781' WHERE site_url LIKE '%chacarafamiliareal%';
UPDATE projects SET zabbix_host_id = '10779' WHERE site_url LIKE '%forgestudio.tech%' AND zabbix_host_id IS NULL;
```

---

## Backend

### Arquivo: `api/src/routes/monitoring.js`

#### Helper: `zabbixCall(method, params)`

- Encapsula autenticação + request JSON-RPC
- Credenciais via env vars: `ZABBIX_URL`, `ZABBIX_USER`, `ZABBIX_PASS`
- Token reutilizado enquanto válido; re-login automático se expirar
- Usa `fetch` nativo (Node 18+)

#### GET /api/monitoring — Lista de sites monitorados

1. Busca projetos com `zabbix_host_id IS NOT NULL`
   - Admin: todos
   - Cliente: filtrado por `client_id` do usuário logado
2. Verifica cache em memória (`Map` com TTL 2 min)
   - Key: `"monitoring_all"` (admin) ou `"monitoring_client_{id}"` (cliente)
3. Se cache expirado, chama Zabbix:
   - `host.get` com `selectTriggers` para status up/down
   - `item.get` para response time do web scenario (item key: `web.test.time[*]`)
4. Resposta:

```json
{
  "sites": [
    {
      "project_id": "uuid",
      "project_name": "Site Versa",
      "client_name": "Versa EMS",
      "url": "https://versaems.com",
      "status": "online",
      "response_time_ms": 142,
      "last_check": "2026-03-28T15:30:00Z",
      "zabbix_host_id": "10776"
    }
  ]
}
```

#### GET /api/monitoring/:project_id — Detalhe com histórico

1. Busca projeto + `zabbix_host_id`
2. Verifica permissão (admin ou dono do projeto)
3. Chama Zabbix `history.get` — últimas 24h de response time
4. Calcula uptime % a partir dos triggers
5. Resposta:

```json
{
  "site": {
    "project_id": "uuid",
    "project_name": "Site Versa",
    "client_name": "Versa EMS",
    "url": "https://versaems.com",
    "status": "online",
    "response_time_ms": 142,
    "uptime_24h": 99.98,
    "last_check": "2026-03-28T15:30:00Z"
  },
  "history": [
    { "timestamp": "2026-03-28T15:30:00Z", "response_time_ms": 142 },
    { "timestamp": "2026-03-28T15:28:00Z", "response_time_ms": 138 }
  ],
  "incidents": [
    { "start": "2026-03-27T03:12:00Z", "end": "2026-03-27T03:18:00Z", "duration_min": 6 }
  ]
}
```

### Cache em memória

```javascript
const cache = new Map()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutos

function getCached(key) {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data
  return null
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() })
}
```

### Hook em PUT /api/projects/:id (criação automática)

No handler existente de update de projeto, adicionar lógica condicional:

- Se `site_url` foi adicionada/alterada e `status = 'published'` e `zabbix_host_id` é NULL:
  1. Criar host no Zabbix (grupo "Websites", groupid: 22)
  2. Criar web scenario "Check homepage" (delay 1m, step com URL, status_codes 200)
  3. Salvar `zabbix_host_id` no projeto
- Se `site_url` removida e `zabbix_host_id` existe:
  1. Desativar host no Zabbix (`host.update` com `status: 1`)
  2. Limpar `zabbix_host_id` no projeto

### Variáveis de ambiente

Adicionar ao `.env` do container API e ao docker-compose:

```
ZABBIX_URL=http://127.0.0.1:8081/api_jsonrpc.php
ZABBIX_USER=Admin
ZABBIX_PASS=zyjkom-5fuFru-xapkat
```

Nota: API e Zabbix rodam em docker-composes separados. Usar `127.0.0.1:8081` (porta exposta do Zabbix web na VPS) via rede host do container API, ou a URL pública como fallback.

---

## Frontend

### Sidebar (`Sidebar.jsx`)

Admin — adicionar em `adminMainLinks`:
```javascript
{ to: '/portal/admin/monitoring', label: 'Monitoramento', icon: SignalIcon }
```

Cliente — adicionar em `clientLinks`:
```javascript
{ to: '/portal/monitoring', label: 'Monitoramento', icon: SignalIcon }
```

Posição: entre Financeiro e Solicitações.

### Ícone SignalIcon

SVG inline 20x20 (padrão do projeto): barras de sinal/antena.

### Dashboard — Card resumo

**Admin (Dashboard.jsx):**
- Novo card após os cards existentes
- Consulta `GET /api/monitoring`
- Mostra: `"🟢 4 sites online"` ou `"🔴 1 offline, 3 online"`
- Borda verde se tudo ok, vermelha se algum offline
- Clicável → `/portal/admin/monitoring`

**Cliente (Dashboard.jsx):**
- Mesmo conceito, filtrado
- `"🟢 Seu site está online — 142ms"` ou `"🔴 Seu site está fora do ar"`

### Página dedicada — Admin (`/portal/admin/monitoring`)

**Arquivo:** `src/pages/portal/admin/Monitoring.jsx`

**Layout:**
- Header: "Monitoramento" + "Status dos sites dos clientes"
- Grid de cards responsivo (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Cada card:
  - Nome do projeto (bold) + nome do cliente (muted)
  - URL como link externo (truncada)
  - Badge de status: verde "Online" / vermelho "Offline"
  - Tempo de resposta: "142ms" (verde se < 500ms, amarelo se < 1500ms, vermelho se > 1500ms)
  - Último check: tempo relativo ("há 1 min")
- Card clicável → abre detalhe inline (expand) ou modal

**Detalhe (expand/modal):**
- Gráfico de linha: tempo de resposta últimas 24h (recharts `LineChart`)
  - Eixo X: hora (formatada HH:mm)
  - Eixo Y: ms
  - Linha cor copper
- Uptime 24h: "99.98%"
- Lista de incidentes: data/hora início, duração

**Auto-refresh:** `setInterval` a cada 2 min chamando `refetch()`

### Página dedicada — Cliente (`/portal/monitoring`)

**Arquivo:** `src/pages/portal/Monitoring.jsx`

Mesma estrutura da admin, mas:
- Sem coluna/label de cliente (óbvio que é dele)
- Empty state: "Nenhum site monitorado no momento"
- Se só 1 site: layout de card único centralizado com gráfico inline

### Router (`router.jsx`)

```jsx
<Route path="admin/monitoring" element={<AdminMonitoring />} />
<Route path="monitoring" element={<ClientMonitoring />} />
```

---

## Fora de escopo (futuro)

- Notificações push/email quando site cai
- Monitoramento de SSL (validade do certificado)
- Latência por região
- Integração com Google Analytics (feature separada)

---

## Verificação

1. **Admin vê todos os sites** com status correto do Zabbix
2. **Cliente vê só os seus** sites
3. **Cache funciona** — segunda request em < 2 min não chama Zabbix
4. **Gráfico de histórico** mostra últimas 24h de response time
5. **Dashboard cards** mostram resumo correto
6. **Novo projeto com URL** cria web scenario automaticamente
7. **Projeto sem URL** não aparece no monitoramento
