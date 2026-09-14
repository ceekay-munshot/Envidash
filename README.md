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

### ✅ Ask AI
- "Ask AI" chat panel that answers questions about the dashboard from live data
- Two-pass agent: routes the question to tools, fetches, then streams a markdown answer
- Read-only tools only, with prompt-injection guards (see "Ask AI chat agent" below)

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
js/lib/sdk.js                   — Munshot Dashboard SDK client singleton
js/lib/host-context.js          — Host session/ticker store (useHostContext)
js/lib/munshot-api.js           — Read-only Munshot datasource client
js/agent/dashboardContext.js    — Ask AI: what this dashboard is + live filters
js/agent/tools.js               — Ask AI: tool catalog (one per datasource)
js/agent/prompts.js             — Ask AI: router + answer prompts (verbatim)
js/agent/runAgent.js            — Ask AI: two-pass agent loop (verbatim)
js/components/AskAiPanel.js     — Ask AI: chat panel (verbatim port)
js/dashboard.js                 — Charts, interactivity, search, toggles, host handlers
data/companies.json             — Per-company bizMix + geoMix data (loaded at runtime)
scripts/fetch-company-data.mjs  — Refresher: pulls real data into companies.json
worker.js                       — Cloudflare Worker: embed guard + static assets
functions/_middleware.js        — Embed protection (imported by worker.js)
_headers                        — CSP frame-ancestors allow-list
README.md                       — This file
```

## Munshot host integration

The dashboard runs as an iframe inside the Munshot host and talks to it through
the Munshot Dashboard SDK (see `dashboard-skill/reference/auth-standards.md`).

- `index.html` loads the SDK as a **classic** script in `<head>`, before the app
  scripts. Do not add `type="module"`, `async`, or `defer`.
- `js/lib/sdk.js` creates the one SDK client at load time. `autoReady` is left at
  its default — **never** set it to `false` and **never** call `sdk.ready()`.
- `js/lib/host-context.js` mirrors the reference `useHostContext` hook: it reads
  `sdk.getContext()` and re-syncs on every `sdk.onMessage(...)`.
- Session token: `context.session.token`, sent as `Authorization: Bearer <token>`
  on every Munshot API call. There is no login screen and no server-side token.
- Selected ticker: `context.market.selectedTicker` drives the active company.
- Host requests handled: `dashboard.capture.visual` (PNG Blob of
  `#dashboard-main`) and `dashboard.capture.snapshot` (bounded JSON state).

Opened outside the host, the SDK falls back to a no-op client: the dashboard
still renders from `data/companies.json`, the header shows "Standalone preview",
and company search is disabled until a session token arrives.

## Ask AI chat agent

Every Munshot dashboard ships an "Ask AI" panel (see
`dashboard-skill/reference/chat-agent.md`). It is the launcher at the bottom
right; the panel slides in from the right edge.

The LLM endpoint takes one string and returns text — no tool calling, no
message roles — so the agent loop runs here, in the dashboard, in two passes
per question:

1. **Route** — `POST /query-router` (`stream:false`, `temperature:0`) with the
   dashboard description, the tool catalog, recent history and the question.
   It replies with JSON naming which tools to call.
2. **Run tools** — the dashboard calls its own fetch functions in parallel, at
   most 3 per turn, each isolating its own failure.
3. **Answer** — `POST /query-router` (`stream:true`) with the question and the
   fetched data, streamed back as NDJSON and rendered as markdown.

### Files

| File | Source |
|---|---|
| `js/agent/dashboardContext.js` | written for this dashboard |
| `js/agent/tools.js` | written for this dashboard |
| `js/agent/prompts.js` | copied from the skill — do not edit |
| `js/agent/runAgent.js` | copied from the skill — do not edit |
| `js/components/AskAiPanel.js` | copied from the skill — do not edit |

When the dashboard changes, update `dashboardContext.js` and `tools.js` only.
Both are classic-script ports of the skill's ES modules (this repo has no
bundler), matching how `js/lib/sdk.js` and `js/lib/host-context.js` were
ported. Two substitutions were unavoidable: the React panel is built with DOM
calls, and `react-markdown` + `remark-gfm` are replaced by `renderMarkdown()`
inside `AskAiPanel.js`, which escapes the model's output before parsing — raw
HTML is never rendered, and GFM tables are supported.

### Tools

| Tool | Section | Datasource |
|---|---|---|
| `get_dashboard_dataset` | Business & Market | `data/companies.json` (refetched) |
| `get_company_financials` | Financial Quality | `combined_financials` |
| `get_insider_trades` | Promoter & Mgmt | `insider_trades` |
| `get_filings_and_announcements` | Governance & Flags | `combined_filings_announcements` |
| `get_live_quote` | Ownership & Valuation | `stock_data` |
| `get_company_news` | Ground Checks | `news_search` |

Note that only `get_dashboard_dataset` returns what the charts currently
render. The other five fetch **live** data for their section, while most of the
dashboard's own charts are still mock (see "Real-data status" below), so a
figure the agent quotes may not match the chart beside it until those panels
are wired to the same datasources.

**Every tool is read-only, and that is a security property, not a convenience.**
Tool output (news text, filing descriptions, scraped pages) is untrusted and
could contain injected instructions, so it is fenced inside `<data>` blocks,
`</data>` sequences inside it are stripped, and the answer prompt states above
and below the data that its content is never instructions. The structural guard
is that the worst an injection can achieve is a wrong sentence on screen —
nothing can be sent, written or deleted. Never add a write-capable datasource
(`email_send`, `agent_run`, anything that sends or mutates) to
`js/lib/munshot-api.js` or `js/agent/tools.js`.

Failures never surface as raw technical errors: the panel shows a
plain-language message, the detail goes to the console, and the host is told
via `sdk.sendError`.

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

Note: on the deployed Cloudflare Worker, opening the URL directly in a tab
redirects to the host app — that is the embed protection in
`functions/_middleware.js` doing its job. Use the plain static server above for
local UI work.

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
- Backend / server (auth comes from the Munshot host, not from this repo)
- PDF export
- Real-time price feeds
