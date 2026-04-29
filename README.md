# ForensIQ — Forensic + Quality Investor Dashboard

## Overview
A complete, professional investor research dashboard with 6 forensic analysis sections for any company. Built as a UI-only static dashboard with rich mock data, interactive charts, tabs, and toggles.

## Features Implemented

### ✅ Company Search/Select
- Searchable company selector in the top header
- Supports switching between companies (Infosys, HDFC Bank, TCS, Reliance, Asian Paints, Bajaj Finance)
- Real-time quality score update on company switch
- Hero bar with CMP, market cap, P/E, revenue, PAT, debt status, credit rating

### ✅ Section Navigation
- Sticky section navigation bar with 6 numbered tabs
- Smooth transitions between sections
- Icons and numbered indicators per section

### ✅ All 6 Sections with Refresh + Timestamp
1. **Business, Market & Competitive Position** — Industry/TAM, market share trend, business/geo mix donut charts, domestic & global peer tables
2. **Promoter, Management & Capital Allocation** — Holding trend, buyback history, KMP remuneration table, guidance vs delivery tracker, acquisition timeline, corporate actions
3. **Financial Quality & Balance Sheet** — Revenue/PAT trend, margin trend, CFO vs PAT quality, working capital cycle, return ratios, balance sheet snapshot, capex & debt profile
4. **Governance, Accounting & Legal Red Flags** — 8-flag scorecard, auditor history, RPT table, legal proceedings, accounting quality checklist
5. **Ground Checks / Operating Verification** — Headcount vs revenue trend, GST compliance grid, physical indicator table, facility status, debt restructuring
6. **Ownership, Valuation, Catalysts & Risk** — FII/DII/MF/Promoter ownership trend, historical P/E valuation band, peer valuation table, catalyst timeline, risk register

### ✅ Interactive Features
- Chart.js charts with 3Y / 5Y / 10Y period toggles
- Donut/pie charts for business and geography mix with FY toggle
- Company search dropdown with live filtering
- Guidance vs delivery tab toggle (Revenue / Margin)
- Per-section Refresh button with loading animation and timestamp update
- Scroll-to-top button
- Toast notifications on actions
- Tooltips on hover
- Polished hover states throughout

## File Structure
```
index.html                      — Main dashboard HTML (all 6 sections)
css/style.css                   — Full dashboard stylesheet (1500+ lines)
js/dashboard.js                 — Charts, interactivity, search, toggles
data/companies.json             — Per-company bizMix + geoMix data (loaded at runtime)
scripts/fetch-company-data.mjs  — Refresher: pulls real data into companies.json
README.md                       — This file
```

## Data flow — Real Data from Screener.in

The dashboard pulls real company data from `data/companies.json`, which is
refreshed from Screener.in periodically. This includes:
- **Business/Service Mix** — segment-wise revenue breakdown
- **Geographic Mix** — revenue by region
- **Financial Metrics** — revenue, net profit trends
- **Ownership** — promoter, FII, DII, mutual fund shareholding

`_meta.status` in the JSON tells you what you're looking at:
- `"seed"`     — approximate placeholder values, NOT verified
- `"partial"`  — refresh ran but some companies failed
- `"live"`     — every company refreshed successfully on the date in
                 `_meta.lastUpdated`

### Refreshing the data — Automated (GitHub Actions)

The easiest way is to let GitHub Actions update the data daily:

1. **No setup needed** — runs automatically at 02:00 UTC daily
2. **Manual trigger available** — go to Actions → "Fetch Screener Data" → "Run workflow"

Workflow file: `.github/workflows/fetch-screener-data.yml`

If you hit 403 errors during the workflow, set up authentication:

1. Open https://www.screener.in in your browser and log in
2. Open DevTools → Application → Cookies and copy the values of `csrftoken` and `sessionid`
3. Go to your repository Settings → Secrets and variables → Actions
4. Create a secret named `SCREENER_COOKIE` with value: `csrftoken=...; sessionid=...`
5. Re-run the workflow

### Refreshing the data — Manual (Node.js)

Requires Node 18+ (built-in `fetch`). Zero dependencies.

```bash
node scripts/fetch-company-data.mjs
```

The script scrapes Screener.in's consolidated page for each company and
writes updated data back into `data/companies.json`. If Screener returns 403:

```bash
COOKIE='csrftoken=...; sessionid=...' node scripts/fetch-company-data.mjs
```

After it runs successfully, commit the updated `data/companies.json`.

### Serving the dashboard

`fetch('data/companies.json')` does not work over the `file://` protocol.
Serve the folder over HTTP:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Design Style
- Professional, premium, desktop-first
- Soft shadows, rounded cards, gradient accents
- Indigo/purple brand palette
- Clean Inter + JetBrains Mono typography
- Responsive (works on tablet/mobile with adapted layouts)

## Default Company: Infosys Ltd.
Most data outside of `bizMix` / `geoMix` is still realistic mock data based on
Infosys's publicly known financials and profile.

## Real-data status
- **Wired** to refreshable JSON: Business / Service Mix, Geography Mix
  (see "Data flow" above).
- **Still mocked**: every other chart and table (financials, ownership,
  market share trend, peers, valuation bands, etc.).

## Not Implemented (UI Only)
- Backend / server
- Authentication
- PDF export
- Real-time price feeds
