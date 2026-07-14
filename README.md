# greenedge-factory-dashboard

- `index.html` — the P&L dashboard, reads `data.json` and `master.json` from GitHub and auto-refreshes every 30s.
- `entry.html` — supervisor data entry form (Handles, Printing, Tufting, Trimming, Packaging, Attendance). Each tab submits independently to `data.json` via `/api/submit`.
- `api/submit.js` — Vercel serverless function that validates a shared PIN and writes to `data.json` via the GitHub API using a server-side token.
- `master.json` — product/client rates, referenced by both the dashboard and the entry form.

First-time setup (GitHub token + PIN in Vercel): see [SETUP.md](SETUP.md).