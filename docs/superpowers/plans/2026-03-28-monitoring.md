# Monitor de Disponibilidade de Sites — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dashboard no portal mostrando status up/down + tempo de resposta dos sites dos clientes, integrado com Zabbix.

**Architecture:** Backend Fastify atua como proxy para a API JSON-RPC do Zabbix, com cache em memória (TTL 2min). Frontend mostra card resumo no Dashboard + página dedicada com grid de cards e gráfico de histórico (recharts). Campo `zabbix_host_id` na tabela `projects` vincula cada projeto ao host no Zabbix.

**Tech Stack:** Fastify (backend), React 19 + Tailwind v3 (frontend), Recharts (gráficos), Zabbix 7 API JSON-RPC

**Spec:** `docs/superpowers/specs/2026-03-28-monitoring-design.md`

---

### Task 1: Migration — campo zabbix_host_id

**Files:**
- Create: `api/src/db/migrations/010_monitoring.sql`

- [ ] **Step 1: Criar migration**

```sql
-- 010_monitoring.sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS zabbix_host_id VARCHAR(20);
```

- [ ] **Step 2: Verificar que a migration é aplicada**

A API aplica migrations automaticamente ao iniciar. No dev local, reiniciar a API:

```bash
cd /Users/gcocenza/Documents/_Empresa/06_VPS/mission-control-api
node src/server.js
```

Verificar no log: `Applied migration 010_monitoring.sql` (ou similar).

- [ ] **Step 3: Commit**

```bash
git add api/src/db/migrations/010_monitoring.sql
git commit -m "feat: migration zabbix_host_id na tabela projects"
```

---

### Task 2: Backend — Zabbix helper + rota de monitoramento

**Files:**
- Create: `api/src/lib/zabbix.js`
- Create: `api/src/routes/monitoring.js`
- Modify: `api/src/server.js:1-73`

- [ ] **Step 1: Criar helper Zabbix (`api/src/lib/zabbix.js`)**

```javascript
const ZABBIX_URL = process.env.ZABBIX_URL || 'http://127.0.0.1:8081/api_jsonrpc.php'
const ZABBIX_USER = process.env.ZABBIX_USER || 'Admin'
const ZABBIX_PASS = process.env.ZABBIX_PASS || ''

let authToken = null

async function zabbixRequest(method, params, useAuth = true) {
  const body = {
    jsonrpc: '2.0',
    method,
    params,
    id: Date.now(),
  }

  const headers = { 'Content-Type': 'application/json' }
  if (useAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const res = await fetch(ZABBIX_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (data.error) {
    // Token expirado — re-login e retry uma vez
    if (useAuth && data.error.data?.includes?.('Not authorised')) {
      authToken = null
      await login()
      return zabbixRequest(method, params, true)
    }
    throw new Error(`Zabbix API error: ${data.error.message} - ${data.error.data}`)
  }

  return data.result
}

async function login() {
  const result = await zabbixRequest('user.login', {
    username: ZABBIX_USER,
    password: ZABBIX_PASS,
  }, false)
  authToken = result
  return result
}

export async function zabbixCall(method, params) {
  if (!authToken) {
    await login()
  }
  return zabbixRequest(method, params)
}
```

- [ ] **Step 2: Criar rota de monitoramento (`api/src/routes/monitoring.js`)**

```javascript
import { requireAuth } from '../middleware/rbac.js'
import { zabbixCall } from '../lib/zabbix.js'

// Cache em memória
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

export default async function monitoringRoutes(app) {

  // ── GET /api/monitoring — lista de sites monitorados ──
  app.get('/', { preHandler: requireAuth() }, async (request) => {
    const { user } = request
    const cacheKey = user.role === 'admin' ? 'monitoring_all' : `monitoring_client_${user.id}`

    const cached = getCached(cacheKey)
    if (cached) return cached

    // Buscar projetos com zabbix_host_id
    let query, params
    if (user.role === 'admin') {
      query = `
        SELECT p.id, p.name, p.production_url, p.zabbix_host_id, c.company_name as client_name
        FROM projects p
        JOIN clients c ON c.id = p.client_id
        WHERE p.zabbix_host_id IS NOT NULL AND p.status != 'archived'
        ORDER BY p.name
      `
      params = []
    } else {
      query = `
        SELECT p.id, p.name, p.production_url, p.zabbix_host_id, c.company_name as client_name
        FROM projects p
        JOIN clients c ON c.id = p.client_id
        WHERE p.zabbix_host_id IS NOT NULL AND p.status != 'archived' AND c.user_id = $1
        ORDER BY p.name
      `
      params = [user.id]
    }

    const { rows: projects } = await app.db.query(query, params)

    if (projects.length === 0) {
      const result = { sites: [] }
      setCache(cacheKey, result)
      return result
    }

    const hostIds = projects.map((p) => p.zabbix_host_id)

    // Buscar triggers (up/down) — trigger value "1" = problem (down)
    let triggers = []
    try {
      triggers = await zabbixCall('trigger.get', {
        hostids: hostIds,
        output: ['triggerid', 'description', 'value', 'lastchange'],
        selectHosts: ['hostid'],
        filter: { description: 'Web scenario*failed*' },
        searchWildcardsEnabled: true,
        search: { description: 'failed' },
      })
    } catch {
      // Zabbix indisponível — retornar status unknown
    }

    // Buscar items de response time (web.test.time)
    let items = []
    try {
      items = await zabbixCall('item.get', {
        hostids: hostIds,
        output: ['itemid', 'hostid', 'lastvalue', 'lastclock'],
        search: { key_: 'web.test.time' },
        searchWildcardsEnabled: true,
      })
    } catch {
      // Zabbix indisponível
    }

    // Mapear dados por hostid
    const triggerByHost = {}
    for (const t of triggers) {
      const hostid = t.hosts?.[0]?.hostid
      if (hostid) triggerByHost[hostid] = t
    }

    const itemByHost = {}
    for (const item of items) {
      // Pegar o item de response time do step (não o scenario total)
      if (!itemByHost[item.hostid] || item.key_.includes('step')) {
        itemByHost[item.hostid] = item
      }
    }

    const sites = projects.map((p) => {
      const trigger = triggerByHost[p.zabbix_host_id]
      const item = itemByHost[p.zabbix_host_id]

      const isDown = trigger?.value === '1'
      const responseTime = item?.lastvalue ? Math.round(parseFloat(item.lastvalue) * 1000) : null
      const lastCheck = item?.lastclock
        ? new Date(parseInt(item.lastclock) * 1000).toISOString()
        : null

      return {
        project_id: p.id,
        project_name: p.name,
        client_name: p.client_name,
        url: p.production_url,
        status: trigger ? (isDown ? 'offline' : 'online') : 'unknown',
        response_time_ms: responseTime,
        last_check: lastCheck,
        zabbix_host_id: p.zabbix_host_id,
      }
    })

    const result = { sites }
    setCache(cacheKey, result)
    return result
  })

  // ── GET /api/monitoring/:projectId — detalhe com histórico 24h ──
  app.get('/:projectId', { preHandler: requireAuth() }, async (request, reply) => {
    const { projectId } = request.params
    const { user } = request

    // Buscar projeto com permissão
    let query, params
    if (user.role === 'admin') {
      query = `
        SELECT p.id, p.name, p.production_url, p.zabbix_host_id, c.company_name as client_name
        FROM projects p
        JOIN clients c ON c.id = p.client_id
        WHERE p.id = $1 AND p.zabbix_host_id IS NOT NULL
      `
      params = [projectId]
    } else {
      query = `
        SELECT p.id, p.name, p.production_url, p.zabbix_host_id, c.company_name as client_name
        FROM projects p
        JOIN clients c ON c.id = p.client_id
        WHERE p.id = $1 AND p.zabbix_host_id IS NOT NULL AND c.user_id = $2
      `
      params = [projectId, user.id]
    }

    const { rows } = await app.db.query(query, params)
    if (rows.length === 0) {
      return reply.code(404).send({ message: 'Projeto nao encontrado ou sem monitoramento' })
    }

    const project = rows[0]
    const hostId = project.zabbix_host_id
    const now = Math.floor(Date.now() / 1000)
    const since = now - 24 * 60 * 60 // 24h atrás

    // Buscar item de response time
    let itemId = null
    try {
      const items = await zabbixCall('item.get', {
        hostids: [hostId],
        output: ['itemid', 'lastvalue', 'lastclock'],
        search: { key_: 'web.test.time' },
        searchWildcardsEnabled: true,
        limit: 1,
      })
      if (items.length > 0) itemId = items[0].itemid
    } catch {
      return reply.code(502).send({ message: 'Zabbix indisponivel' })
    }

    // Buscar histórico de response time (últimas 24h)
    let history = []
    if (itemId) {
      try {
        const raw = await zabbixCall('history.get', {
          itemids: [itemId],
          history: 0, // float
          time_from: since,
          time_till: now,
          output: ['clock', 'value'],
          sortfield: 'clock',
          sortorder: 'ASC',
        })
        history = raw.map((h) => ({
          timestamp: new Date(parseInt(h.clock) * 1000).toISOString(),
          response_time_ms: Math.round(parseFloat(h.value) * 1000),
        }))
      } catch {
        // sem histórico
      }
    }

    // Buscar triggers para status + incidentes
    let status = 'unknown'
    let incidents = []
    try {
      const triggers = await zabbixCall('trigger.get', {
        hostids: [hostId],
        output: ['triggerid', 'value', 'lastchange'],
        search: { description: 'failed' },
        searchWildcardsEnabled: true,
      })
      if (triggers.length > 0) {
        status = triggers[0].value === '1' ? 'offline' : 'online'
      }

      // Buscar eventos de problema (incidentes) das últimas 24h
      if (triggers.length > 0) {
        const events = await zabbixCall('event.get', {
          objectids: [triggers[0].triggerid],
          time_from: since,
          time_till: now,
          output: ['clock', 'value', 'r_clock'],
          selectAcknowledges: ['clock'],
          sortfield: 'clock',
          sortorder: 'ASC',
        })

        // value=1 = problema começou, r_clock = quando resolveu
        for (const evt of events) {
          if (evt.value === '1') {
            const start = new Date(parseInt(evt.clock) * 1000)
            const end = evt.r_clock && evt.r_clock !== '0'
              ? new Date(parseInt(evt.r_clock) * 1000)
              : null
            const durationMin = end
              ? Math.round((end - start) / 60000)
              : Math.round((Date.now() - start) / 60000)
            incidents.push({
              start: start.toISOString(),
              end: end ? end.toISOString() : null,
              duration_min: durationMin,
            })
          }
        }
      }
    } catch {
      // sem dados de trigger
    }

    // Calcular uptime 24h
    const totalMinutes = 24 * 60
    const downMinutes = incidents.reduce((sum, i) => sum + i.duration_min, 0)
    const uptime24h = totalMinutes > 0
      ? Math.round(((totalMinutes - downMinutes) / totalMinutes) * 10000) / 100
      : 100

    const lastItem = history.length > 0 ? history[history.length - 1] : null

    return {
      site: {
        project_id: project.id,
        project_name: project.name,
        client_name: project.client_name,
        url: project.production_url,
        status,
        response_time_ms: lastItem?.response_time_ms ?? null,
        uptime_24h: uptime24h,
        last_check: lastItem?.timestamp ?? null,
      },
      history,
      incidents,
    }
  })
}
```

- [ ] **Step 3: Registrar rota no server.js**

Em `api/src/server.js`, adicionar import na linha 19 (antes do `authHook`):

```javascript
import monitoringRoutes from './routes/monitoring.js'
```

E registrar a rota na linha 73 (após `dashboardRoutes`):

```javascript
await app.register(monitoringRoutes, { prefix: '/api/monitoring' })
```

- [ ] **Step 4: Adicionar variáveis de ambiente**

No `.env` do backend (ou docker-compose):

```
ZABBIX_URL=http://127.0.0.1:8081/api_jsonrpc.php
ZABBIX_USER=Admin
ZABBIX_PASS=zyjkom-5fuFru-xapkat
```

- [ ] **Step 5: Testar localmente**

Abrir túnel SSH para o Zabbix (`ssh -L 8081:127.0.0.1:8081 vps`) e testar:

```bash
curl -s http://localhost:3000/api/monitoring -H "Cookie: sid=<session>" | jq .
```

Esperado: JSON com array `sites` contendo os projetos monitorados.

- [ ] **Step 6: Commit**

```bash
git add api/src/lib/zabbix.js api/src/routes/monitoring.js api/src/server.js
git commit -m "feat: backend monitoramento — proxy Zabbix com cache"
```

---

### Task 3: Frontend — Página de monitoramento (Admin)

**Files:**
- Create: `src/pages/portal/admin/Monitoring.jsx`
- Modify: `src/router.jsx:1-82`
- Modify: `src/components/portal/Sidebar.jsx:12-26`

- [ ] **Step 1: Criar ícone SignalIcon no Sidebar**

Em `src/components/portal/Sidebar.jsx`, adicionar após a função `ChartIcon` (linha 226):

```javascript
function SignalIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}
```

- [ ] **Step 2: Adicionar link no Sidebar**

Em `src/components/portal/Sidebar.jsx`, adicionar `Monitoramento` em `adminMainLinks` (após Financeiro, linha 17):

```javascript
const adminMainLinks = [
  { to: '/portal', label: 'Mission Control', icon: HomeIcon, end: true },
  { to: '/portal/admin/clients', label: 'Clientes', icon: UsersIcon },
  { to: '/portal/projects', label: 'Projetos', icon: FolderIcon },
  { to: '/portal/admin/plans', label: 'Planos', icon: TagIcon },
  { to: '/portal/billing', label: 'Financeiro', icon: DollarIcon },
  { to: '/portal/admin/monitoring', label: 'Monitoramento', icon: SignalIcon },
  { to: '/portal/tickets', label: 'Solicitações', icon: TicketIcon },
  { to: '/portal/settings', label: 'Configurações', icon: GearIcon },
]
```

E em `clientLinks` (após Financeiro, linha 7):

```javascript
const clientLinks = [
  { to: '/portal', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/portal/projects', label: 'Projetos', icon: FolderIcon },
  { to: '/portal/billing', label: 'Financeiro', icon: DollarIcon },
  { to: '/portal/monitoring', label: 'Monitoramento', icon: SignalIcon },
  { to: '/portal/tickets', label: 'Solicitações', icon: TicketIcon },
  { to: '/portal/settings', label: 'Configurações', icon: GearIcon },
]
```

- [ ] **Step 3: Criar página admin de monitoramento**

Criar `src/pages/portal/admin/Monitoring.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { useApi, apiFetch } from '../../../hooks/useApi.js'

export default function Monitoring() {
  const { data, loading, error, refetch } = useApi('/api/monitoring')
  const sites = data?.sites || []
  const [expanded, setExpanded] = useState(null)

  // Auto-refresh a cada 2 min
  useEffect(() => {
    const interval = setInterval(refetch, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refetch])

  const onlineCount = sites.filter((s) => s.status === 'online').length
  const offlineCount = sites.filter((s) => s.status === 'offline').length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-portal-text">Monitoramento</h1>
          <p className="text-portal-muted text-sm mt-1">Status dos sites dos clientes</p>
        </div>
        {sites.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            {onlineCount > 0 && (
              <span className="flex items-center gap-1.5 text-success">
                <span className="w-2 h-2 rounded-full bg-success" />
                {onlineCount} online
              </span>
            )}
            {offlineCount > 0 && (
              <span className="flex items-center gap-1.5 text-danger">
                <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                {offlineCount} offline
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-portal-muted text-sm">Carregando...</p>
      ) : error ? (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4">
          <p className="text-danger text-sm">{error}</p>
        </div>
      ) : sites.length === 0 ? (
        <div className="bg-portal-surface border border-portal-border rounded-xl p-8 text-center">
          <p className="text-portal-muted text-sm">Nenhum site monitorado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <SiteCard
              key={site.project_id}
              site={site}
              isExpanded={expanded === site.project_id}
              onToggle={() => setExpanded(expanded === site.project_id ? null : site.project_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SiteCard({ site, isExpanded, onToggle }) {
  const statusColor = site.status === 'online' ? 'success' : site.status === 'offline' ? 'danger' : 'portal-muted'
  const statusLabel = site.status === 'online' ? 'Online' : site.status === 'offline' ? 'Offline' : 'Desconhecido'

  const rtColor = site.response_time_ms == null
    ? 'text-portal-muted'
    : site.response_time_ms < 500
      ? 'text-success'
      : site.response_time_ms < 1500
        ? 'text-warning'
        : 'text-danger'

  const timeAgo = site.last_check ? getTimeAgo(new Date(site.last_check)) : '—'

  return (
    <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-portal-border/10 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <p className="text-portal-text font-semibold text-sm truncate">{site.project_name}</p>
            <p className="text-portal-muted text-xs truncate">{site.client_name}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}/15 text-${statusColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-${statusColor} ${site.status === 'offline' ? 'animate-pulse' : ''}`} />
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-copper hover:text-copper-dark truncate max-w-[200px]"
            onClick={(e) => e.stopPropagation()}
          >
            {site.url?.replace(/^https?:\/\//, '')}
          </a>
          <div className="flex items-center gap-3 shrink-0 ml-2">
            {site.response_time_ms != null && (
              <span className={`font-medium ${rtColor}`}>{site.response_time_ms}ms</span>
            )}
            <span className="text-portal-muted">{timeAgo}</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <SiteDetail projectId={site.project_id} />
      )}
    </div>
  )
}

function SiteDetail({ projectId }) {
  const { data, loading } = useApi(`/api/monitoring/${projectId}`)

  if (loading) {
    return <div className="px-5 pb-5 text-portal-muted text-xs">Carregando detalhes...</div>
  }

  if (!data) return null

  const { site, history, incidents } = data

  return (
    <div className="border-t border-portal-border px-5 pb-5 pt-4 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-portal-bg rounded-lg p-3">
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-0.5">Uptime 24h</p>
          <p className={`text-lg font-bold ${site.uptime_24h >= 99.9 ? 'text-success' : site.uptime_24h >= 99 ? 'text-warning' : 'text-danger'}`}>
            {site.uptime_24h}%
          </p>
        </div>
        <div className="bg-portal-bg rounded-lg p-3">
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-0.5">Tempo de Resposta</p>
          <p className="text-lg font-bold text-portal-text">
            {site.response_time_ms != null ? `${site.response_time_ms}ms` : '—'}
          </p>
        </div>
      </div>

      {/* Gráfico de response time */}
      {history.length > 0 && (
        <ResponseChart history={history} />
      )}

      {/* Incidentes */}
      {incidents.length > 0 && (
        <div>
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-2">Incidentes (24h)</p>
          <div className="space-y-1">
            {incidents.map((inc, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-danger/5 rounded-lg px-3 py-2">
                <span className="text-portal-text">
                  {new Date(inc.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {inc.end ? ` — ${new Date(inc.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ' — em andamento'}
                </span>
                <span className="text-danger font-medium">{inc.duration_min} min</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ResponseChart({ history }) {
  // Amostrar para não sobrecarregar (máx 100 pontos)
  const step = Math.max(1, Math.floor(history.length / 100))
  const sampled = history.filter((_, i) => i % step === 0)

  const maxMs = Math.max(...sampled.map((h) => h.response_time_ms))
  const chartHeight = 80

  return (
    <div>
      <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-2">Tempo de Resposta (24h)</p>
      <div className="bg-portal-bg rounded-lg p-3">
        <svg viewBox={`0 0 ${sampled.length} ${chartHeight}`} className="w-full h-20" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#D5851E"
            strokeWidth="1.5"
            points={sampled.map((h, i) => `${i},${chartHeight - (h.response_time_ms / maxMs) * (chartHeight - 10)}`).join(' ')}
          />
        </svg>
        <div className="flex justify-between text-[10px] text-portal-muted mt-1">
          <span>{new Date(sampled[0].timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{new Date(sampled[sampled.length - 1].timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date) / 1000)
  if (seconds < 60) return 'agora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `há ${hours}h`
}
```

- [ ] **Step 4: Adicionar rota no router**

Em `src/router.jsx`, adicionar import (linha 16, após DashboardMRR):

```javascript
import Monitoring from './pages/portal/admin/Monitoring.jsx'
import ClientMonitoring from './pages/portal/Monitoring.jsx'
```

Adicionar rotas (linha 77, após dashboard-mrr):

```jsx
<Route path="admin/monitoring" element={<Monitoring />} />
```

E na seção de rotas do cliente (linha 69, após tickets/:id):

```jsx
<Route path="monitoring" element={<ClientMonitoring />} />
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/portal/admin/Monitoring.jsx src/components/portal/Sidebar.jsx src/router.jsx
git commit -m "feat: página de monitoramento admin com cards e gráfico"
```

---

### Task 4: Frontend — Página de monitoramento (Cliente)

**Files:**
- Create: `src/pages/portal/Monitoring.jsx`

- [ ] **Step 1: Criar página cliente de monitoramento**

Criar `src/pages/portal/Monitoring.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi.js'

export default function ClientMonitoring() {
  const { data, loading, error, refetch } = useApi('/api/monitoring')
  const sites = data?.sites || []
  const [selectedId, setSelectedId] = useState(null)

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(refetch, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refetch])

  return (
    <div>
      <h1 className="text-2xl font-bold text-portal-text mb-1">Monitoramento</h1>
      <p className="text-portal-muted text-sm mb-8">Status dos seus sites</p>

      {loading ? (
        <p className="text-portal-muted text-sm">Carregando...</p>
      ) : error ? (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4">
          <p className="text-danger text-sm">{error}</p>
        </div>
      ) : sites.length === 0 ? (
        <div className="bg-portal-surface border border-portal-border rounded-xl p-8 text-center">
          <p className="text-portal-muted text-sm">Nenhum site monitorado no momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sites.map((site) => (
            <ClientSiteCard
              key={site.project_id}
              site={site}
              isExpanded={selectedId === site.project_id}
              onToggle={() => setSelectedId(selectedId === site.project_id ? null : site.project_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ClientSiteCard({ site, isExpanded, onToggle }) {
  const statusColor = site.status === 'online' ? 'success' : site.status === 'offline' ? 'danger' : 'portal-muted'
  const statusLabel = site.status === 'online' ? 'Online' : site.status === 'offline' ? 'Offline' : 'Desconhecido'

  const rtColor = site.response_time_ms == null
    ? 'text-portal-muted'
    : site.response_time_ms < 500
      ? 'text-success'
      : site.response_time_ms < 1500
        ? 'text-warning'
        : 'text-danger'

  const timeAgo = site.last_check ? getTimeAgo(new Date(site.last_check)) : '—'

  return (
    <div className="bg-portal-surface border border-portal-border rounded-xl overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-portal-border/10 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full bg-${statusColor} ${site.status === 'offline' ? 'animate-pulse' : ''}`} />
            <div>
              <p className="text-portal-text font-semibold">{site.project_name}</p>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-copper hover:text-copper-dark text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {site.url?.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}/15 text-${statusColor}`}>
              {statusLabel}
            </span>
            <div className="flex items-center gap-2 mt-1 justify-end">
              {site.response_time_ms != null && (
                <span className={`text-xs font-medium ${rtColor}`}>{site.response_time_ms}ms</span>
              )}
              <span className="text-portal-muted text-xs">{timeAgo}</span>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <ClientSiteDetail projectId={site.project_id} />
      )}
    </div>
  )
}

function ClientSiteDetail({ projectId }) {
  const { data, loading } = useApi(`/api/monitoring/${projectId}`)

  if (loading) return <div className="px-5 pb-5 text-portal-muted text-xs">Carregando detalhes...</div>
  if (!data) return null

  const { site, history, incidents } = data

  return (
    <div className="border-t border-portal-border px-5 pb-5 pt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-portal-bg rounded-lg p-3">
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-0.5">Uptime 24h</p>
          <p className={`text-lg font-bold ${site.uptime_24h >= 99.9 ? 'text-success' : site.uptime_24h >= 99 ? 'text-warning' : 'text-danger'}`}>
            {site.uptime_24h}%
          </p>
        </div>
        <div className="bg-portal-bg rounded-lg p-3">
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-0.5">Tempo de Resposta</p>
          <p className="text-lg font-bold text-portal-text">
            {site.response_time_ms != null ? `${site.response_time_ms}ms` : '—'}
          </p>
        </div>
      </div>

      {history.length > 0 && (
        <div>
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-2">Tempo de Resposta (24h)</p>
          <div className="bg-portal-bg rounded-lg p-3">
            <svg viewBox={`0 0 ${Math.min(history.length, 100)} 80`} className="w-full h-20" preserveAspectRatio="none">
              {(() => {
                const step = Math.max(1, Math.floor(history.length / 100))
                const sampled = history.filter((_, i) => i % step === 0)
                const maxMs = Math.max(...sampled.map((h) => h.response_time_ms))
                return (
                  <polyline
                    fill="none"
                    stroke="#D5851E"
                    strokeWidth="1.5"
                    points={sampled.map((h, i) => `${i},${80 - (h.response_time_ms / maxMs) * 70}`).join(' ')}
                  />
                )
              })()}
            </svg>
          </div>
        </div>
      )}

      {incidents.length > 0 && (
        <div>
          <p className="text-portal-muted text-[10px] uppercase tracking-wider mb-2">Incidentes Recentes</p>
          <div className="space-y-1">
            {incidents.map((inc, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-danger/5 rounded-lg px-3 py-2">
                <span className="text-portal-text">
                  {new Date(inc.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {inc.end ? ` — ${new Date(inc.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ' — em andamento'}
                </span>
                <span className="text-danger font-medium">{inc.duration_min} min</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date) / 1000)
  if (seconds < 60) return 'agora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `há ${hours}h`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/portal/Monitoring.jsx
git commit -m "feat: página de monitoramento cliente"
```

---

### Task 5: Dashboard — Card resumo de monitoramento

**Files:**
- Modify: `src/pages/portal/AdminDashboard.jsx:46-106`
- Modify: `src/pages/portal/Dashboard.jsx:35-44`

- [ ] **Step 1: Adicionar card no AdminDashboard**

Em `src/pages/portal/AdminDashboard.jsx`, adicionar import e fetch (linha 2, após useApi):

```javascript
import { useNavigate, Link } from 'react-router-dom'
```

(Substituir o import existente de `useNavigate` na linha 1.)

Adicionar fetch de monitoramento (linha 9, após summaryData):

```javascript
const { data: monitorData } = useApi('/api/monitoring')
```

E adicionar variáveis computadas (após linha 15):

```javascript
const monitorSites = monitorData?.sites || []
const sitesOnline = monitorSites.filter((s) => s.status === 'online').length
const sitesOffline = monitorSites.filter((s) => s.status === 'offline').length
const hasOffline = sitesOffline > 0
```

Inserir o card de monitoramento antes do grid de projetos/clientes (após o fechamento `</div>` do alerta de atraso, ~linha 44):

```jsx
{/* Card monitoramento */}
{monitorSites.length > 0 && (
  <Link
    to="/portal/admin/monitoring"
    className={`block rounded-xl border p-4 mb-8 transition-colors hover:border-copper/40 ${
      hasOffline
        ? 'bg-danger/5 border-danger/30'
        : 'bg-success/5 border-success/30'
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full ${hasOffline ? 'bg-danger animate-pulse' : 'bg-success'}`} />
        <span className="text-portal-text text-sm font-medium">
          {hasOffline
            ? `${sitesOffline} site(s) offline, ${sitesOnline} online`
            : `${sitesOnline} site(s) online`
          }
        </span>
      </div>
      <span className="text-portal-muted text-xs">Ver detalhes →</span>
    </div>
  </Link>
)}
```

- [ ] **Step 2: Adicionar card no ClientDashboard**

Em `src/pages/portal/Dashboard.jsx`, adicionar fetch (linha 19, após paymentsData):

```javascript
const { data: monitorData } = useApi('/api/monitoring')
```

E variáveis (após linha 24):

```javascript
const monitorSites = monitorData?.sites || []
const firstSite = monitorSites[0]
```

Inserir card antes da seção "Meus Projetos" (após o fechamento `</div>` dos stat cards, ~linha 44):

```jsx
{/* Monitoramento */}
{firstSite && (
  <Link
    to="/portal/monitoring"
    className={`block rounded-xl border p-4 mb-8 transition-colors hover:border-copper/40 ${
      firstSite.status === 'offline'
        ? 'bg-danger/5 border-danger/30'
        : 'bg-success/5 border-success/30'
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full ${firstSite.status === 'offline' ? 'bg-danger animate-pulse' : 'bg-success'}`} />
        <span className="text-portal-text text-sm font-medium">
          {firstSite.status === 'offline'
            ? 'Seu site está fora do ar'
            : `Seu site está online${firstSite.response_time_ms ? ` — ${firstSite.response_time_ms}ms` : ''}`
          }
        </span>
      </div>
      <span className="text-portal-muted text-xs">Ver detalhes →</span>
    </div>
  </Link>
)}
```

Adicionar `Link` ao import existente (linha 3):

```javascript
import { Link } from 'react-router-dom'
```

(Já existe na linha 3.)

- [ ] **Step 3: Commit**

```bash
git add src/pages/portal/AdminDashboard.jsx src/pages/portal/Dashboard.jsx
git commit -m "feat: cards de monitoramento nos dashboards admin e cliente"
```

---

### Task 6: Setup — popular zabbix_host_id nos projetos existentes

**Files:**
- Nenhum arquivo criado — apenas SQL executado na VPS

- [ ] **Step 1: Verificar projetos e seus production_url**

```bash
ssh vps "docker exec -i mc-postgres psql -U forge -d mission_control -c \"SELECT id, name, production_url FROM projects WHERE production_url IS NOT NULL\""
```

- [ ] **Step 2: Vincular zabbix_host_id com base nos hosts existentes**

Mapear com base nas URLs reais:

```sql
-- versaems.com → hostid 10776
UPDATE projects SET zabbix_host_id = '10776' WHERE production_url LIKE '%versaems.com%';

-- cadu.forgestudio.tech → hostid 10780
UPDATE projects SET zabbix_host_id = '10780' WHERE production_url LIKE '%cadu.forgestudio%';

-- chacarafamiliareal.com.br → hostid 10781
UPDATE projects SET zabbix_host_id = '10781' WHERE production_url LIKE '%chacarafamiliareal%';

-- forgestudio.tech → hostid 10779
UPDATE projects SET zabbix_host_id = '10779' WHERE production_url LIKE '%forgestudio.tech%' AND zabbix_host_id IS NULL;
```

Executar via:

```bash
ssh vps "docker exec -i mc-postgres psql -U forge -d mission_control" <<'SQL'
UPDATE projects SET zabbix_host_id = '10776' WHERE production_url LIKE '%versaems.com%';
UPDATE projects SET zabbix_host_id = '10780' WHERE production_url LIKE '%cadu.forgestudio%';
UPDATE projects SET zabbix_host_id = '10781' WHERE production_url LIKE '%chacarafamiliareal%';
UPDATE projects SET zabbix_host_id = '10779' WHERE production_url LIKE '%forgestudio.tech%' AND zabbix_host_id IS NULL;
SQL
```

- [ ] **Step 3: Verificar resultado**

```bash
ssh vps "docker exec -i mc-postgres psql -U forge -d mission_control -c \"SELECT name, production_url, zabbix_host_id FROM projects WHERE zabbix_host_id IS NOT NULL\""
```

---

### Task 7: Deploy

**Files:**
- Nenhum — comandos de deploy

- [ ] **Step 1: Deploy backend**

```bash
rsync -avz --delete /Users/gcocenza/Documents/_Empresa/06_VPS/mission-control-api/ vps:/opt/mission-control-api/ --exclude node_modules --exclude .env
ssh vps "cd /opt/mission-control-api && docker compose up -d --build"
```

Adicionar variáveis ao `.env` na VPS:

```bash
ssh vps "cat >> /opt/mission-control-api/.env << 'EOF'
ZABBIX_URL=http://127.0.0.1:8081/api_jsonrpc.php
ZABBIX_USER=Admin
ZABBIX_PASS=zyjkom-5fuFru-xapkat
EOF"
```

- [ ] **Step 2: Deploy frontend**

```bash
cd /Users/gcocenza/Documents/_Empresa/07_SITE_FORGE/codigo
npm run build
rsync -avz --delete dist/ vps:/opt/forge-site/
ssh vps "chown -R www-data:www-data /opt/forge-site/"
```

- [ ] **Step 3: Testar no browser**

- Acessar `https://forgestudio.tech/portal` → login admin
- Dashboard: card verde "X sites online"
- Sidebar: link "Monitoramento"
- Página de monitoramento: cards com status, tempo de resposta, gráfico

- [ ] **Step 4: Commit final e push**

```bash
git add -A
git commit -m "feat: monitor de disponibilidade de sites — integração Zabbix"
git push
```
