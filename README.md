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
index.html          — Main dashboard HTML (all 6 sections)
css/style.css       — Full dashboard stylesheet (1500+ lines)
js/dashboard.js     — Charts, interactivity, search, toggles
README.md           — This file
```

## Design Style
- Professional, premium, desktop-first
- Soft shadows, rounded cards, gradient accents
- Indigo/purple brand palette
- Clean Inter + JetBrains Mono typography
- Responsive (works on tablet/mobile with adapted layouts)

## Mock Company: Infosys Ltd. (Default)
All data is realistic mock data based on Infosys's publicly known financials and profile. No real data is fetched or wired.

## Not Implemented (UI Only)
- Real data API integration
- Backend / server
- Authentication
- PDF export
- Real-time price feeds
"# Envidash" 
"# Envidash" 
