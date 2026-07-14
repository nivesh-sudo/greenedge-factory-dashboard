# greenedge-factory-dashboard

- `index.html` — the P&L dashboard, reads `data.json` and `master.json` from GitHub and auto-refreshes every 30s.
- `entry.html` — supervisor data entry form (Handles, Printing, Tufting, Trimming, Packaging, Attendance). Each tab submits independently to `data.json` via `/api/submit`. Attendance is headcount only (no worker names). Selecting a client/model that's missing info for that tab (new or existing) reveals just the field(s) needed and, on submit, shows a confirm dialog + a separate PIN prompt before writing to the shared product list.
- `api/submit.js` — Vercel serverless function that validates a shared PIN and writes to `data.json` via the GitHub API using a server-side token.
- `api/add-product.js` — same pattern, but writes to `master.json`. Only fills gaps on a product — never overwrites a value someone already set — so a BOM can be assembled incrementally across departments/days.
- `reports.html` — analytics page: date-range filter, revenue/net-profit/margin KPIs, daily revenue-vs-profit and department-revenue charts (Chart.js via CDN), client revenue table, and a pending-BOM-entries table (products missing info some department needs, with a jump-to-`entry.html` link).
- `master.json` — product/client rates, referenced by the dashboard, entry form, and reports page.

First-time setup (GitHub token + PIN in Vercel): see [SETUP.md](SETUP.md).