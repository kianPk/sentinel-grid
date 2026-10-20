import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const PORT = process.env.PORT || 8810
const app = express()
app.use(cors())
app.use(express.json())

const severities = ['critical', 'high', 'medium', 'low', 'info']
const tactics = ['Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement', 'Exfiltration', 'Impact']

const assets = [
  { id: 'a1', name: 'edge-gw-01', type: 'firewall', env: 'prod', risk: 72, ip: '10.0.0.1' },
  { id: 'a2', name: 'api-core', type: 'service', env: 'prod', risk: 41, ip: '10.1.4.20' },
  { id: 'a3', name: 'ci-runner', type: 'host', env: 'build', risk: 58, ip: '10.8.2.11' },
  { id: 'a4', name: 'db-primary', type: 'database', env: 'prod', risk: 33, ip: '10.1.9.3' },
  { id: 'a5', name: 'vpn-hub', type: 'network', env: 'prod', risk: 64, ip: '10.0.0.8' },
  { id: 'a6', name: 'staging-web', type: 'service', env: 'stage', risk: 27, ip: '10.2.1.14' },
]

const alerts = []
function seedAlerts() {
  const samples = [
    ['Brute-force spike on VPN', 'critical', 'Credential Access', 'a5', 'Multiple failed MFA attempts from ASN 58224'],
    ['Suspicious outbound DNS volume', 'high', 'Exfiltration', 'a2', 'TXT query burst to rare TLD'],
    ['New admin role binding', 'high', 'Privilege Escalation', 'a2', 'iam:PassRole followed by CreateAccessKey'],
    ['Port scan fingerprint', 'medium', 'Discovery', 'a1', 'SYN scan pattern across /24'],
    ['Unsigned binary execution', 'medium', 'Execution', 'a3', 'Process tree anomaly on runner'],
    ['Geo-impossible login', 'high', 'Initial Access', 'a5', 'Session hopped IR → DE in < 4m'],
    ['TLS cert nearing expiry', 'low', 'Impact', 'a2', 'api.zyrax.ir expires in 12 days'],
    ['WAF rule bypass attempt', 'medium', 'Defense Evasion', 'a1', 'Encoded path traversal blocked'],
  ]
  for (const [title, severity, tactic, assetId, detail] of samples) {
    alerts.push({
      id: randomUUID(),
      title,
      severity,
      tactic,
      assetId,
      detail,
      status: Math.random() > 0.7 ? 'acknowledged' : 'open',
      createdAt: Date.now() - Math.floor(Math.random() * 86400000 * 2),
    })
  }
}
seedAlerts()

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'sentinel-grid' }))
app.get('/api/overview', (_req, res) => {
  const open = alerts.filter((a) => a.status === 'open')
  res.json({
    open: open.length,
    critical: open.filter((a) => a.severity === 'critical').length,
    assets: assets.length,
    meanRisk: Math.round(assets.reduce((s, a) => s + a.risk, 0) / assets.length),
  })
})
app.get('/api/alerts', (req, res) => {
  let list = [...alerts]
  if (req.query.severity) list = list.filter((a) => a.severity === req.query.severity)
  if (req.query.status) list = list.filter((a) => a.status === req.query.status)
  list.sort((a, b) => b.createdAt - a.createdAt)
  res.json({ alerts: list })
})
app.patch('/api/alerts/:id', (req, res) => {
  const alert = alerts.find((a) => a.id === req.params.id)
  if (!alert) return res.status(404).json({ error: 'Not found' })
  const schema = z.object({ status: z.enum(['open', 'acknowledged', 'resolved']).optional() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  Object.assign(alert, parsed.data)
  res.json({ alert })
})
app.get('/api/assets', (_req, res) => res.json({ assets }))
app.get('/api/tactics', (_req, res) => {
  const counts = Object.fromEntries(tactics.map((t) => [t, 0]))
  for (const a of alerts) counts[a.tactic] = (counts[a.tactic] || 0) + 1
  res.json({ tactics: counts })
})

app.listen(PORT, () => console.log(`sentinel-grid on :${PORT}`))
