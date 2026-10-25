<script setup>
import { computed, onMounted, ref } from 'vue'
import { ASSETS, TACTICS, PLAYBOOKS, seedAlerts } from './demo'

const alerts = ref(seedAlerts())
const assets = ref(ASSETS)
const sevFilter = ref('all')
const statusFilter = ref('open')
const selected = ref(null)
const tick = ref(0)

onMounted(() => {
  setInterval(() => {
    tick.value++
  }, 1000)
})

const filtered = computed(() => {
  let list = [...alerts.value]
  if (sevFilter.value !== 'all') list = list.filter((a) => a.severity === sevFilter.value)
  if (statusFilter.value !== 'all') list = list.filter((a) => a.status === statusFilter.value)
  return list.sort((a, b) => b.createdAt - a.createdAt)
})

const overview = computed(() => {
  const open = alerts.value.filter((a) => a.status === 'open')
  return {
    open: open.length,
    critical: open.filter((a) => a.severity === 'critical').length,
    assets: assets.value.length,
    meanRisk: Math.round(assets.value.reduce((s, a) => s + a.risk, 0) / assets.value.length),
  }
})

const tacticBars = computed(() => {
  const counts = Object.fromEntries(TACTICS.map((t) => [t, 0]))
  for (const a of alerts.value) counts[a.tactic] = (counts[a.tactic] || 0) + 1
  const max = Math.max(1, ...Object.values(counts))
  return TACTICS.map((t) => ({ name: t, n: counts[t], pct: (counts[t] / max) * 100 }))
})

function assetName(id) {
  return assets.value.find((a) => a.id === id)?.name || id
}

function ago(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000) + tick.value * 0)
  const m = Math.floor(s / 60)
  if (m < 60) return m + 'm ago'
  return Math.floor(m / 60) + 'h ago'
}

function setStatus(alert, status) {
  alert.status = status
  if (selected.value?.id === alert.id) selected.value = { ...alert }
}

function playbookById(id) {
  return PLAYBOOKS.find((p) => p.id === id) || null
}

function assignPlaybook(alert, playbookId) {
  alert.playbookId = playbookId || null
  if (selected.value?.id === alert.id) selected.value = { ...alert }
}
</script>

<template>
  <div class="shell">
    <header class="top">
      <div class="brand">
        <div class="mark" aria-hidden="true" />
        <div>
          <h1>Sentinel Grid</h1>
          <p>Security operations console · alert triage · asset risk</p>
        </div>
      </div>
      <div class="live"><span /> Live demo feed</div>
    </header>

    <section class="kpis">
      <div><b>{{ overview.open }}</b><span>Open alerts</span></div>
      <div class="crit"><b>{{ overview.critical }}</b><span>Critical</span></div>
      <div><b>{{ overview.assets }}</b><span>Assets</span></div>
      <div><b>{{ overview.meanRisk }}</b><span>Mean risk</span></div>
    </section>

    <div class="grid">
      <section class="panel alerts">
        <div class="toolbar">
          <h2>Alerts</h2>
          <select v-model="sevFilter">
            <option value="all">All severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
          <select v-model="statusFilter">
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="all">All status</option>
          </select>
        </div>
        <div class="list">
          <button
            v-for="a in filtered"
            :key="a.id"
            type="button"
            class="row"
            :class="{ active: selected?.id === a.id }"
            @click="selected = a"
          >
            <em :data-s="a.severity">{{ a.severity }}</em>
            <div>
              <strong>{{ a.title }}</strong>
              <small>{{ assetName(a.assetId) }} · {{ a.tactic }} · {{ ago(a.createdAt) }}</small>
            </div>
          </button>
        </div>
      </section>

      <aside class="panel detail" v-if="selected">
        <h2>{{ selected.title }}</h2>
        <p class="detail-meta">
          <em :data-s="selected.severity">{{ selected.severity }}</em>
          <span>{{ selected.tactic }}</span>
          <span>{{ assetName(selected.assetId) }}</span>
        </p>
        <p class="body">{{ selected.detail }}</p>
        <div class="actions">
          <button type="button" @click="setStatus(selected, 'acknowledged')">Acknowledge</button>
          <button type="button" class="ok" @click="setStatus(selected, 'resolved')">Resolve</button>
          <button type="button" @click="setStatus(selected, 'open')">Reopen</button>
        </div>
        <p class="hint">Status: <code>{{ selected.status }}</code></p>

        <div class="playbooks">
          <h3>Response playbook</h3>
          <select
            :value="selected.playbookId || ''"
            @change="assignPlaybook(selected, $event.target.value || null)"
          >
            <option value="">Unassigned</option>
            <option v-for="pb in PLAYBOOKS" :key="pb.id" :value="pb.id">{{ pb.title }}</option>
          </select>
          <ol v-if="playbookById(selected.playbookId)" class="steps">
            <li v-for="(step, idx) in playbookById(selected.playbookId).steps" :key="idx">{{ step }}</li>
          </ol>
          <p v-else class="pb-hint">Assign a playbook to guide triage steps.</p>
        </div>
      </aside>
      <aside v-else class="panel detail empty">
        <p>Select an alert to triage.</p>
      </aside>

      <section class="panel tactics">
        <h2>ATT&CK coverage (demo)</h2>
        <div v-for="t in tacticBars" :key="t.name" class="bar">
          <span>{{ t.name }}</span>
          <i><i :style="{ width: t.pct + '%' }" /></i>
          <b>{{ t.n }}</b>
        </div>
      </section>

      <section class="panel assets">
        <h2>Assets</h2>
        <table>
          <thead>
            <tr><th>Name</th><th>Type</th><th>Env</th><th>Risk</th></tr>
          </thead>
          <tbody>
            <tr v-for="a in assets" :key="a.id">
              <td>
                <strong>{{ a.name }}</strong>
                <small>{{ a.ip }}</small>
              </td>
              <td>{{ a.type }}</td>
              <td>{{ a.env }}</td>
              <td>
                <div class="risk"><i :style="{ width: a.risk + '%' }" /><span>{{ a.risk }}</span></div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  padding: 18px clamp(14px, 3vw, 28px) 28px;
  display: grid;
  gap: 14px;
}
.top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  animation: rise 0.45s ease;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
.brand { display: flex; gap: 12px; align-items: center; }
.mark {
  width: 44px; height: 44px; border-radius: 12px;
  background:
    conic-gradient(from 210deg, rgba(255,92,108,.4), rgba(106,167,255,.35), transparent 70%),
    #101821;
  border: 1px solid var(--line);
  position: relative;
}
.mark::after {
  content: '';
  position: absolute; inset: 12px;
  border: 2px solid #6aa7ff;
  border-radius: 50%;
  border-top-color: #ff5c6c;
  animation: spin 6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
h1 { margin: 0; font-size: 1.25rem; letter-spacing: -0.02em; }
.brand p { margin: 4px 0 0; color: var(--muted); font-size: 0.85rem; }
.live {
  display: flex; gap: 8px; align-items: center;
  font-family: var(--mono); font-size: 0.75rem; color: var(--low);
  padding: 8px 12px; border: 1px solid var(--line); border-radius: 999px;
}
.live span {
  width: 8px; height: 8px; border-radius: 50%; background: var(--low);
  box-shadow: 0 0 0 4px rgba(94,200,160,.15);
  animation: pulse 1.8s ease infinite;
}
@keyframes pulse {
  50% { box-shadow: 0 0 0 6px rgba(94,200,160,.05); }
}
.kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.kpis > div {
  padding: 14px;
  border-radius: 14px;
  background: var(--panel);
  border: 1px solid var(--line);
  display: grid; gap: 4px;
}
.kpis b { font-size: 1.45rem; font-family: var(--mono); }
.kpis span { color: var(--faint); font-size: 0.72rem; text-transform: uppercase; letter-spacing: .06em; }
.kpis .crit b { color: var(--crit); }
.grid {
  display: grid;
  grid-template-columns: 1.2fr 0.9fr;
  grid-template-areas:
    'alerts detail'
    'tactics assets';
  gap: 12px;
}
.panel {
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px;
  min-height: 200px;
}
.alerts { grid-area: alerts; }
.detail { grid-area: detail; }
.tactics { grid-area: tactics; }
.assets { grid-area: assets; }
.toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
.toolbar h2, .panel > h2 { margin: 0; font-size: 0.95rem; flex: 1; }
select {
  padding: 7px 10px; border-radius: 8px; border: 1px solid var(--line); background: #0a1016;
}
.list { display: grid; gap: 6px; max-height: 420px; overflow: auto; }
.row {
  display: grid; grid-template-columns: 78px 1fr; gap: 10px; align-items: start;
  text-align: left; padding: 10px; border-radius: 10px; border: 1px solid transparent;
  transition: background .15s, border-color .15s;
}
.row:hover, .row.active { background: #111a24; border-color: var(--line); }
.row strong { display: block; font-size: 0.9rem; }
.row small { color: var(--muted); font-size: 0.75rem; }
em {
  font-style: normal; font-family: var(--mono); font-size: 0.65rem; text-transform: uppercase;
  padding: 4px 6px; border-radius: 6px; text-align: center; background: #121a22;
}
em[data-s='critical'] { color: var(--crit); background: rgba(255,92,108,.12); }
em[data-s='high'] { color: var(--high); background: rgba(255,147,79,.12); }
em[data-s='medium'] { color: var(--med); background: rgba(240,193,74,.1); }
em[data-s='low'] { color: var(--low); background: rgba(94,200,160,.1); }
em[data-s='info'] { color: var(--info); background: rgba(106,167,255,.1); }
.detail-meta { display: flex; gap: 8px; flex-wrap: wrap; color: var(--muted); font-size: 0.82rem; }
.body { color: var(--muted); line-height: 1.5; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.actions button {
  padding: 8px 12px; border-radius: 8px; border: 1px solid var(--line); background: #0a1016;
}
.actions .ok { border-color: rgba(94,200,160,.4); color: var(--low); }
.hint { color: var(--faint); font-size: 0.8rem; }
.hint code { color: var(--info); font-family: var(--mono); }
.playbooks {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  display: grid;
  gap: 10px;
}
.playbooks h3 { margin: 0; font-size: 0.8rem; color: var(--faint); text-transform: uppercase; letter-spacing: .06em; }
.playbooks .steps { margin: 0; padding-left: 1.1rem; color: var(--muted); font-size: 0.85rem; line-height: 1.45; }
.pb-hint { margin: 0; color: var(--faint); font-size: 0.8rem; }
.empty { display: grid; place-items: center; color: var(--faint); }
.bar {
  display: grid; grid-template-columns: 140px 1fr 24px; gap: 8px; align-items: center;
  margin: 8px 0; font-size: 0.75rem; color: var(--muted);
}
.bar > i {
  display: block; height: 8px; border-radius: 99px; background: #121a22; overflow: hidden;
}
.bar > i > i {
  display: block; height: 100%; background: linear-gradient(90deg, #6aa7ff, #ff5c6c);
  border-radius: 99px;
}
.bar b { font-family: var(--mono); font-size: 0.72rem; color: var(--text); }
table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
th { text-align: left; color: var(--faint); font-weight: 500; padding: 6px 4px; border-bottom: 1px solid var(--line); }
td { padding: 10px 4px; border-bottom: 1px solid rgba(28,42,56,.6); vertical-align: top; }
td strong { display: block; }
td small { color: var(--faint); font-family: var(--mono); font-size: 0.72rem; }
.risk {
  position: relative; height: 18px; width: 72px; background: #121a22; border-radius: 6px; overflow: hidden;
}
.risk i { position: absolute; inset: 0 auto 0 0; background: linear-gradient(90deg, #5ec8a0, #ff934f, #ff5c6c); }
.risk span { position: relative; z-index: 1; font-family: var(--mono); font-size: 0.68rem; padding-left: 6px; }
@media (max-width: 980px) {
  .grid { grid-template-columns: 1fr; grid-template-areas: 'alerts' 'detail' 'tactics' 'assets'; }
  .kpis { grid-template-columns: 1fr 1fr; }
  .bar { grid-template-columns: 1fr; }
}
</style>
