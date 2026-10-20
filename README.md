# Sentinel Grid

**Security operations console** — alert triage, asset risk, and ATT&CK-style tactic coverage.

Live demo: **https://kianpk.github.io/sentinel-grid/**

## Stack

Vue 3 · Vite · Express · Zod

## Features

- Open / critical / asset KPIs
- Severity + status filters
- Acknowledge / resolve workflow
- Asset inventory with risk bars
- Demo ATT&CK tactic histogram

## Run

```bash
cd server && npm i && node index.js   # :8810
cd client && npm i && npm run dev     # :5180
cd client && npm run build            # → docs/
```

Defensive SOC UI demo — not an offensive toolkit.
