export const ASSETS = [
  { id: 'a1', name: 'edge-gw-01', type: 'firewall', env: 'prod', risk: 72, ip: '10.0.0.1' },
  { id: 'a2', name: 'api-core', type: 'service', env: 'prod', risk: 41, ip: '10.1.4.20' },
  { id: 'a3', name: 'ci-runner', type: 'host', env: 'build', risk: 58, ip: '10.8.2.11' },
  { id: 'a4', name: 'db-primary', type: 'database', env: 'prod', risk: 33, ip: '10.1.9.3' },
  { id: 'a5', name: 'vpn-hub', type: 'network', env: 'prod', risk: 64, ip: '10.0.0.8' },
  { id: 'a6', name: 'staging-web', type: 'service', env: 'stage', risk: 27, ip: '10.2.1.14' },
]

export function seedAlerts() {
  const rows = [
    ['Brute-force spike on VPN', 'critical', 'Credential Access', 'a5', 'Multiple failed MFA attempts from ASN 58224'],
    ['Suspicious outbound DNS volume', 'high', 'Exfiltration', 'a2', 'TXT query burst to rare TLD'],
    ['New admin role binding', 'high', 'Privilege Escalation', 'a2', 'iam:PassRole followed by CreateAccessKey'],
    ['Port scan fingerprint', 'medium', 'Discovery', 'a1', 'SYN scan pattern across /24'],
    ['Unsigned binary execution', 'medium', 'Execution', 'a3', 'Process tree anomaly on runner'],
    ['Geo-impossible login', 'high', 'Initial Access', 'a5', 'Session hopped IR → DE in < 4m'],
    ['TLS cert nearing expiry', 'low', 'Impact', 'a2', 'api.zyrax.ir expires in 12 days'],
    ['WAF rule bypass attempt', 'medium', 'Defense Evasion', 'a1', 'Encoded path traversal blocked'],
    ['Anomalous RDP from jump host', 'high', 'Lateral Movement', 'a3', 'Unusual auth package sequence'],
    ['Backup job skipped checksum', 'info', 'Impact', 'a4', 'Nightly dump completed without verify'],
  ]
  return rows.map(([title, severity, tactic, assetId, detail], i) => ({
    id: 'al_' + (i + 1),
    title,
    severity,
    tactic,
    assetId,
    detail,
    status: i % 4 === 0 ? 'acknowledged' : 'open',
    playbookId: i === 0 ? 'pb_contain' : i === 1 ? 'pb_dns' : null,
    createdAt: Date.now() - i * 3600_000 * 1.7,
  }))
}

export const PLAYBOOKS = [
  {
    id: 'pb_contain',
    title: 'Brute-force containment',
    steps: ['Block source at edge WAF', 'Force MFA re-enrollment', 'Rotate VPN pre-shared keys', 'Review auth logs 24h'],
  },
  {
    id: 'pb_dns',
    title: 'Suspicious DNS exfil',
    steps: ['Sinkhole rare TLD queries', 'Snapshot resolver logs', 'Isolate affected workload', 'Open ticket with NetOps'],
  },
  {
    id: 'pb_priv',
    title: 'Privilege escalation',
    steps: ['Revoke temporary admin roles', 'Disable new access keys', 'Run IAM policy diff', 'Notify identity team'],
  },
  {
    id: 'pb_malware',
    title: 'Unsigned binary execution',
    steps: ['Quarantine host from VLAN', 'Collect process tree', 'Submit hash to sandbox', 'Rebuild runner image'],
  },
]

export const TACTICS = [
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Exfiltration',
  'Impact',
]
