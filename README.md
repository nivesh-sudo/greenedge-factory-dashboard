# greenedge-factory-dashboard

- `index.html` — the P&L dashboard, reads `data.json` and `master.json` from GitHub and auto-refreshes every 30s.
- `entry.html` — supervisor data entry form (Handles, Printing, Tufting, Trimming, Packaging, Attendance). Each tab submits independently to `data.json` via `/api/submit`.
- `api/submit.js` — Vercel serverless function that validates a shared PIN and writes to `data.json` via the GitHub API using a server-side token.
- `api/add-product.js` — same pattern, but writes to `master.json`. Lets a supervisor register a model that has no BOM yet, straight from `entry.html`'s "New model" toggle on each tab. It only asks for the field(s) that tab's revenue math needs (e.g. weight for Handles, height for Tufting, packaging type + BPS for Packaging), and only fills gaps on an existing product — it never overwrites a value someone already set. The BOM can end up assembled incrementally across departments/days.
- `master.json` — product/client rates, referenced by both the dashboard and the entry form.

First-time setup (GitHub token + PIN in Vercel): see [SETUP.md](SETUP.md).