#!/usr/bin/env node
// Refresh data/companies.json from Screener.in.
//
//   Usage:  node scripts/fetch-company-data.mjs
//           COOKIE='csrftoken=...; sessionid=...' node scripts/fetch-company-data.mjs
//
// What it pulls from screener.in/company/<slug>/consolidated/:
//   * Top summary card  -> summary[ticker]               (mcap, cmp, p/e, roce, roe, book value, divy, 52w hi/lo)
//   * Profit & Loss     -> profitLoss[ticker]            (years, sales, expenses, opProfit, opmPct,
//                                                         otherIncome, interest, depreciation, pbt, taxPct,
//                                                         netProfit, eps)
//   * Cash Flows        -> cashFlow[ticker]              (years, cfo, cfi, cff, netCash)
//   * Ratios            -> ratios[ticker]                (years, debtorDays, inventoryDays, daysPayable,
//                                                         workingCapitalDays, cashConvCycle, roce)
//   * Shareholding      -> shareholdingHistory[ticker]   (quarters, promoter, fii, dii, govt, public)
//   * Quarterly P&L     -> quarterly[ticker]             (quarters, sales, opProfit, opmPct, netProfit, eps)
//
// Derived (so the dashboard can show real per-company time series without
// re-doing the math in the browser):
//   * derived.revPat[ticker]            -> {3Y,5Y,10Y} revenue + pat arrays
//   * derived.marginTrend[ticker]       -> {3Y,5Y,10Y} ebitda + pat margin arrays
//   * derived.cfoPat[ticker]            -> {3Y,5Y}     cfo + pat arrays
//   * derived.wc[ticker]                -> {5Y,10Y}    dso/dpo/nwc arrays
//   * derived.returns[ticker]           -> {3Y,5Y}     roce trend
//   * derived.promoterHolding[ticker]   -> {3Y,5Y,10Y} promoter % series
//   * derived.ownershipTrend[ticker]    -> {3Y,5Y}     fii/dii/promoter series
//
// Legacy compatibility: financialMetrics[ticker] (rev/np TTM history) and
// ownership[ticker] (latest quarter promoter/fii/dii/mf %) are still
// emitted so existing dashboard panels keep working.
//
// Notes:
//   * Screener serves data only to browsers — we send a real User-Agent.
//     Set COOKIE env var (csrftoken + sessionid from a logged-in browser
//     session) to unlock the full 10-year history. Without it Screener
//     trims to ~5 years and some sections may 403.
//   * The HTML structure drifts. Each parser tries multiple selectors
//     and falls back gracefully — failures keep previous JSON values
//     intact and mark `source = "seed"` so the UI renders something.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '..', 'data', 'companies.json');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const COOKIE = process.env.COOKIE || '';

const COLOR_PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#94a3b8', '#a855f7'];

// ----------------------------------------------------------------------------
// HTTP
// ----------------------------------------------------------------------------
async function fetchScreenerHtml(slug) {
  const url = `https://www.screener.in/company/${slug}/consolidated/`;
  const headers = {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };
  if (COOKIE) headers['Cookie'] = COOKIE;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  return res.text();
}

// ----------------------------------------------------------------------------
// Generic HTML parsing helpers (no DOM, regex only — Node 18+ built-ins)
// ----------------------------------------------------------------------------
const stripHtml = (s) =>
  String(s)
    // Screener wraps expandable row labels (Sales, Expenses, Net Profit,
    // Promoters, etc.) inside <button class="button-plain">…</button>. Drop
    // the tags but keep the inner text so the label survives.
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

function parseScreenerNumber(s) {
  if (s == null) return null;
  let v = String(s).trim();
  if (!v || v === '-' || v === '—' || v === '–') return null;
  let negative = false;
  if (/^\(.*\)$/.test(v)) { negative = true; v = v.slice(1, -1); }
  v = v.replace(/[,₹\s]/g, '').replace(/%$/, '').replace(/Cr\.?$/i, '').replace(/x$/i, '');
  if (/-$/.test(v)) { negative = true; v = v.slice(0, -1); }
  if (/^-/.test(v)) { negative = true; v = v.slice(1); }
  const n = parseFloat(v);
  if (!isFinite(n)) return null;
  return negative ? -n : n;
}

// Locate the body of <section id="..."> or — if Screener changed structure —
// the chunk between an <h2> matching `headerText` and the next </section>/<h2>.
function extractSection(html, sectionId, headerRegex = null) {
  const re = new RegExp(`<section[^>]*\\bid=["']${sectionId}["'][^>]*>([\\s\\S]*?)</section>`, 'i');
  const m = html.match(re);
  if (m) return m[1];
  if (headerRegex) {
    const re2 = new RegExp(`<h2[^>]*>[\\s\\S]*?${headerRegex.source}[\\s\\S]*?(?=<h2|</section>|$)`, 'i');
    const m2 = html.match(re2);
    if (m2) return m2[0];
  }
  return null;
}

// Parse the FIRST <table> inside `chunk` into { headers, rows: { lcLabel -> values[] } }.
// Header strip handles "Mar 2024", "TTM", "Jun 2024" — we keep the raw text.
// Prefers <table class="data-table"> when present, since Screener decorates
// helper / preview tables with a different class.
function parseFirstTable(chunk) {
  if (!chunk) return null;
  const dataTableMatch = chunk.match(/<table[^>]*class=["'][^"']*\bdata-table\b[^"']*["'][\s\S]*?<\/table>/i);
  const tableMatch = dataTableMatch || chunk.match(/<table[\s\S]*?<\/table>/i);
  if (!tableMatch) return null;
  const t = tableMatch[0];

  const theadMatch = t.match(/<thead[\s\S]*?<\/thead>/i);
  const headerSrc = theadMatch ? theadMatch[0] : t;
  const firstHeaderRow = headerSrc.match(/<tr[^>]*>[\s\S]*?<\/tr>/i)?.[0] || '';
  const headerCells = [...firstHeaderRow.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => stripHtml(m[1]));

  const tbodyMatch = t.match(/<tbody[\s\S]*?<\/tbody>/i);
  const bodySrc = tbodyMatch ? tbodyMatch[0] : t.replace(/<thead[\s\S]*?<\/thead>/i, '');

  const rows = {};
  const rowMatches = [...bodySrc.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  for (const rm of rowMatches) {
    const cells = [...rm[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => stripHtml(m[1]));
    if (cells.length < 2) continue;
    const label = cells[0];
    if (!label) continue;
    rows[label.toLowerCase()] = cells.slice(1);
  }
  return { headers: headerCells.filter(Boolean), rows };
}

function findRow(rows, ...patterns) {
  if (!rows) return null;
  for (const p of patterns) {
    const re = p instanceof RegExp ? p : new RegExp(p, 'i');
    for (const [name, values] of Object.entries(rows)) {
      if (re.test(name)) return values;
    }
  }
  return null;
}

const numericRow = (row) => (row ? row.map(parseScreenerNumber) : null);

// ----------------------------------------------------------------------------
// Section parsers
// ----------------------------------------------------------------------------
function parseTopRatios(html) {
  const out = {};
  const ulMatch = html.match(/<ul[^>]*\bid=["']top-ratios["'][^>]*>[\s\S]*?<\/ul>/i);
  if (!ulMatch) return out;
  const items = [...ulMatch[0].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)];
  for (const li of items) {
    const nameM = li[1].match(/<span[^>]*\bclass=["'][^"']*\bname\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
    if (!nameM) continue;
    const name = stripHtml(nameM[1]).toLowerCase();
    // Take the first "number" span — the rest may be unit / % suffix
    const numM = li[1].match(/<span[^>]*\bclass=["'][^"']*\bnumber\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
    const valStr = numM ? stripHtml(numM[1]) : null;
    const valNum = parseScreenerNumber(valStr);
    // "High / Low" exposes two numbers — capture the raw string for that one
    out[name] = { num: valNum, raw: stripHtml(li[1]) };
  }

  const pick = (regex) => {
    for (const [k, v] of Object.entries(out)) if (regex.test(k)) return v;
    return null;
  };
  const summary = {};
  const mcap = pick(/market\s*cap/);
  if (mcap?.num != null) summary.marketCap = mcap.num; // ₹ Cr
  const cp = pick(/current\s*price/);
  if (cp?.num != null) summary.currentPrice = cp.num;
  const high = pick(/high\s*\/\s*low/);
  if (high?.raw) {
    const nums = [...high.raw.matchAll(/[\d,]+(?:\.\d+)?/g)].map((m) => parseScreenerNumber(m[0])).filter((n) => n != null);
    if (nums.length >= 2) { summary.high52w = nums[0]; summary.low52w = nums[1]; }
  }
  const pe = pick(/stock\s*p\/?e|^p\/?e$/);
  if (pe?.num != null) summary.pe = pe.num;
  const bv = pick(/book\s*value/);
  if (bv?.num != null) summary.bookValue = bv.num;
  const dy = pick(/dividend\s*yield/);
  if (dy?.num != null) summary.dividendYield = dy.num;
  const roce = pick(/^roce$|^roce\s*%/);
  if (roce?.num != null) summary.roce = roce.num;
  const roe = pick(/^roe$|^roe\s*%/);
  if (roe?.num != null) summary.roe = roe.num;
  const fv = pick(/face\s*value/);
  if (fv?.num != null) summary.faceValue = fv.num;

  // Stock change % usually appears in a separate ".company-info-summary" block:
  //   <span class="value-box ...">▲ 23.10 (1.27%)</span>
  const changeM = html.match(/<span[^>]*class=["'][^"']*(?:value-box|stock-change|company-change)[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
  if (changeM) {
    const txt = stripHtml(changeM[1]);
    const pctM = txt.match(/\(\s*(-?\d+(?:\.\d+)?)\s*%\s*\)/);
    if (pctM) {
      summary.changePct = parseFloat(pctM[1]);
      summary.changeDir = /▲|\bup\b|\+/.test(txt) ? 'up' : (/▼|\bdown\b|-/.test(txt) ? 'down' : (summary.changePct >= 0 ? 'up' : 'down'));
    }
  }

  return summary;
}

function parseProfitLoss(html, debugLabel = 'profit-loss') {
  const sec = extractSection(html, 'profit-loss', /Profit\s*&(?:amp;)?\s*Loss/);
  const tbl = parseFirstTable(sec);
  if (!tbl) return null;
  const years = tbl.headers; // e.g. ["Mar 2014", ..., "Mar 2025", "TTM"]
  if (!years.length) return null;
  // Banks use "Revenue" / "Interest Earned"; insurers use "Net Premium Income".
  const sales = numericRow(findRow(tbl.rows, /\bsales\b|\brevenue\b|interest\s*earned|net\s*premium|operating\s*income|total\s*income/));
  const expenses = numericRow(findRow(tbl.rows, /\bexpenses\b|operating\s*expenses/));
  const opProfit = numericRow(findRow(tbl.rows, /operating\s*profit|operating\s*income(?!.*tax)|financing\s*profit/));
  const opmPct = numericRow(findRow(tbl.rows, /\bopm\b|operating\s*margin|financing\s*margin/));
  const otherIncome = numericRow(findRow(tbl.rows, /other\s*income/));
  const interest = numericRow(findRow(tbl.rows, /\binterest\b(?!\s*earned)/));
  const depreciation = numericRow(findRow(tbl.rows, /depreciation|amortis/));
  const pbt = numericRow(findRow(tbl.rows, /profit\s*before\s*tax|\bpbt\b/));
  const taxPct = numericRow(findRow(tbl.rows, /^\s*tax\s*%|tax\s*rate/));
  const netProfit = numericRow(findRow(tbl.rows, /net\s*profit|\bpat\b|profit\s*after\s*tax/));
  const eps = numericRow(findRow(tbl.rows, /^\s*eps\b|earnings\s*per\s*share/));

  if (!sales && !netProfit && !opProfit) {
    console.log(`    [${debugLabel}] no sales/netProfit/opProfit rows matched. labels seen: ${Object.keys(tbl.rows).slice(0, 20).map((s) => `"${s}"`).join(', ')}`);
    return null;
  }
  if (!sales) console.log(`    [${debugLabel}] no sales row matched. labels seen: ${Object.keys(tbl.rows).slice(0, 20).map((s) => `"${s}"`).join(', ')}`);
  if (!netProfit) console.log(`    [${debugLabel}] no netProfit row matched.`);
  return { years, sales, expenses, opProfit, opmPct, otherIncome, interest, depreciation, pbt, taxPct, netProfit, eps };
}

function parseQuarters(html, debugLabel = 'quarters') {
  const sec = extractSection(html, 'quarters', /Quarterly\s*Results/);
  const tbl = parseFirstTable(sec);
  if (!tbl) return null;
  const quarters = tbl.headers;
  if (!quarters.length) return null;
  const sales = numericRow(findRow(tbl.rows, /\bsales\b|\brevenue\b|interest\s*earned|net\s*premium|operating\s*income|total\s*income/));
  const opProfit = numericRow(findRow(tbl.rows, /operating\s*profit|financing\s*profit/));
  const opmPct = numericRow(findRow(tbl.rows, /\bopm\b|operating\s*margin|financing\s*margin/));
  const netProfit = numericRow(findRow(tbl.rows, /net\s*profit|\bpat\b|profit\s*after\s*tax/));
  const eps = numericRow(findRow(tbl.rows, /^\s*eps\b|earnings\s*per\s*share/));
  if (!sales) {
    console.log(`    [${debugLabel}] missing sales/revenue row. labels seen: ${Object.keys(tbl.rows).slice(0, 20).map((s) => `"${s}"`).join(', ')}`);
  }
  return {
    quarters,
    sales,
    expenses: numericRow(findRow(tbl.rows, /\bexpenses\b/)),
    opProfit,
    opmPct,
    netProfit,
    eps,
  };
}

function parseCashFlow(html, debugLabel = 'cash-flow') {
  const sec = extractSection(html, 'cash-flow', /Cash\s*Flows?/);
  const tbl = parseFirstTable(sec);
  if (!tbl) return null;
  const cfo = numericRow(findRow(tbl.rows, /cash\s*(?:from|flow\s*from)?\s*operating|cash\s*generated\s*from\s*operations/));
  const cfi = numericRow(findRow(tbl.rows, /cash\s*(?:from|flow\s*from)?\s*investing/));
  const cff = numericRow(findRow(tbl.rows, /cash\s*(?:from|flow\s*from)?\s*financing/));
  const netCash = numericRow(findRow(tbl.rows, /net\s*cash\s*flow|net\s*increase\s*in\s*cash|net\s*change\s*in\s*cash/));
  if (!cfo) {
    console.log(`    [${debugLabel}] missing CFO row. labels seen: ${Object.keys(tbl.rows).slice(0, 20).map((s) => `"${s}"`).join(', ')}`);
  }
  return { years: tbl.headers, cfo, cfi, cff, netCash };
}

function parseRatios(html) {
  const sec = extractSection(html, 'ratios', /Ratios/);
  const tbl = parseFirstTable(sec);
  if (!tbl) return null;
  return {
    years: tbl.headers,
    debtorDays: numericRow(findRow(tbl.rows, /debtor\s*days/)),
    inventoryDays: numericRow(findRow(tbl.rows, /inventory\s*days/)),
    daysPayable: numericRow(findRow(tbl.rows, /days\s*payable|payable\s*days/)),
    cashConvCycle: numericRow(findRow(tbl.rows, /cash\s*conversion\s*cycle/)),
    workingCapitalDays: numericRow(findRow(tbl.rows, /working\s*capital\s*days/)),
    roce: numericRow(findRow(tbl.rows, /^roce\b/)),
  };
}

function parseShareholding(html, debugLabel = 'shareholding') {
  // Screener has tabs Quarterly / Yearly under the shareholding section.
  // We extract the FIRST table — that's the quarterly view by default.
  const sec = extractSection(html, 'shareholding', /Shareholding\s*Pattern/);
  if (!sec) {
    console.log(`    [${debugLabel}] no <section id="shareholding"> nor "Shareholding Pattern" header found`);
    return null;
  }

  // The two tabs may both be in the DOM. Prefer the quarterly tab when its
  // wrapper is present; otherwise fall back to whichever table is first.
  let chunk = sec;
  const quarterlyDiv = sec.match(/<div[^>]*\bid=["']quarterly-shp["'][^>]*>([\s\S]*?)(?=<div[^>]*\bid=["']yearly-shp["']|<\/section>|$)/i);
  if (quarterlyDiv) chunk = quarterlyDiv[1];

  const tbl = parseFirstTable(chunk);
  if (!tbl) {
    console.log(`    [${debugLabel}] section found but no <table class="data-table"> inside; section length=${sec.length}`);
    return null;
  }

  const quarters = tbl.headers;
  const promoter = numericRow(findRow(tbl.rows, /promoter/));
  const fii = numericRow(findRow(tbl.rows, /\bfii|foreign\s*inst/));
  const dii = numericRow(findRow(tbl.rows, /\bdii|domestic\s*inst/));
  const govt = numericRow(findRow(tbl.rows, /government/));
  const publicShare = numericRow(findRow(tbl.rows, /\bpublic\b/));

  if (!promoter && !fii && !dii) {
    console.log(`    [${debugLabel}] no promoter/fii/dii row matched. labels seen: ${Object.keys(tbl.rows).slice(0, 20).map((s) => `"${s}"`).join(', ')}`);
    return null;
  }
  return { quarters, promoter, fii, dii, govt, public: publicShare };
}

// Best-effort segment parser kept from earlier revision for companies that
// happen to expose a "Segment-wise Revenue" or "Geographic Revenue" table on
// their consolidated page. Most companies don't, in which case we return
// null and the dashboard keeps the existing seed values.
function parseMixTable(html, sectionTitleRegex) {
  const sectionRe = new RegExp(`<h\\d[^>]*>\\s*${sectionTitleRegex.source}[\\s\\S]*?</table>`, 'i');
  const section = html.match(sectionRe);
  if (!section) return null;
  const rows = [...section[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  if (rows.length < 2) return null;

  const headerCells = [...rows[0][1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => stripHtml(m[1]));
  const idxFY25 = headerCells.findIndex((h) => /FY\s*25|Mar\s*25|2024[-\s]?25/i.test(h));
  const idxFY23 = headerCells.findIndex((h) => /FY\s*23|Mar\s*23|2022[-\s]?23/i.test(h));
  if (idxFY25 < 0 || idxFY23 < 0) return null;

  const labels = [], fy25 = [], fy23 = [];
  for (const row of rows.slice(1)) {
    const cells = [...row[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => stripHtml(m[1]));
    if (!cells.length) continue;
    const label = cells[0];
    const v25 = parseScreenerNumber(cells[idxFY25]);
    const v23 = parseScreenerNumber(cells[idxFY23]);
    if (!label || /total/i.test(label) || v25 == null || v23 == null) continue;
    labels.push(label);
    fy25.push(v25);
    fy23.push(v23);
  }
  if (!labels.length) return null;

  const norm = (arr) => {
    const sum = arr.reduce((a, b) => a + b, 0);
    if (sum > 90 && sum < 110) return arr;
    return arr.map((v) => +((v * 100) / sum).toFixed(1));
  };
  const colors = labels.map((_, i) => COLOR_PALETTE[i % COLOR_PALETTE.length]);
  return {
    FY25: { labels, data: norm(fy25), colors, source: 'screener.in' },
    FY23: { labels, data: norm(fy23), colors, source: 'screener.in' },
  };
}

// ----------------------------------------------------------------------------
// Derivation: turn raw Screener tables into the time-series shapes the
// dashboard charts already consume.
// ----------------------------------------------------------------------------
function lastN(arr, n) {
  if (!arr || !arr.length) return null;
  return arr.slice(Math.max(0, arr.length - n));
}

// Given a {years[], rows...} P&L block, return {3Y,5Y,10Y} arrays for revenue + pat.
function deriveRevPat(pl) {
  if (!pl || !pl.years || !pl.sales || !pl.netProfit) return null;
  // Drop a trailing TTM column from the year axis so the chart shows FY years.
  const isTtm = (h) => /\bTTM\b/i.test(h);
  let years = [...pl.years];
  let revenue = [...pl.sales];
  let pat = [...pl.netProfit];
  if (years.length && isTtm(years[years.length - 1])) {
    years = years.slice(0, -1);
    revenue = revenue.slice(0, -1);
    pat = pat.slice(0, -1);
  }
  // Re-label "Mar 2025" -> "FY25"
  const labels = years.map((y) => {
    const m = y.match(/(?:FY\s*)?'?(\d{2})\b|(?:Mar|FY)\s*(\d{4})/i);
    if (m) {
      const yy = m[1] || (m[2] ? m[2].slice(2) : null);
      if (yy) return `FY${yy}`;
    }
    return y;
  });
  const make = (n) => {
    const lab = lastN(labels, n);
    const rev = lastN(revenue, n);
    const p = lastN(pat, n);
    if (!lab || lab.length < Math.min(2, n)) return null;
    return { labels: lab, revenue: rev, pat: p };
  };
  const out = {};
  const v3 = make(3); if (v3) out['3Y'] = v3;
  const v5 = make(5); if (v5) out['5Y'] = v5;
  const v10 = make(10); if (v10) out['10Y'] = v10;
  return Object.keys(out).length ? out : null;
}

function deriveMarginTrend(pl) {
  if (!pl || !pl.opmPct || !pl.netProfit || !pl.sales) return null;
  const isTtm = (h) => /\bTTM\b/i.test(h);
  let years = [...pl.years];
  let opm = [...pl.opmPct];
  let pat = pl.netProfit.map((np, i) => (np != null && pl.sales[i]) ? +(np * 100 / pl.sales[i]).toFixed(2) : null);
  if (years.length && isTtm(years[years.length - 1])) {
    years = years.slice(0, -1); opm = opm.slice(0, -1); pat = pat.slice(0, -1);
  }
  const labels = years.map((y) => {
    const m = y.match(/(?:FY\s*)?'?(\d{2})\b|(?:Mar|FY)\s*(\d{4})/i);
    const yy = m && (m[1] || (m[2] ? m[2].slice(2) : null));
    return yy ? `FY${yy}` : y;
  });
  const make = (n) => {
    const lab = lastN(labels, n);
    if (!lab || lab.length < Math.min(2, n)) return null;
    return { labels: lab, ebitda: lastN(opm, n), pat: lastN(pat, n) };
  };
  const out = {};
  const v3 = make(3); if (v3) out['3Y'] = v3;
  const v5 = make(5); if (v5) out['5Y'] = v5;
  const v10 = make(10); if (v10) out['10Y'] = v10;
  return Object.keys(out).length ? out : null;
}

function deriveCfoPat(pl, cf) {
  if (!pl || !cf || !cf.cfo || !pl.netProfit) return null;
  // Cash-flow years are FY (no TTM). Align P&L years to cf.years on shared FY labels.
  const fyLabel = (y) => {
    const m = String(y).match(/(?:FY\s*)?'?(\d{2})\b|(?:Mar|FY)\s*(\d{4})/i);
    const yy = m && (m[1] || (m[2] ? m[2].slice(2) : null));
    return yy ? `FY${yy}` : String(y);
  };
  const cfLabels = cf.years.map(fyLabel);
  const plLabels = pl.years.map(fyLabel);
  const aligned = cfLabels.map((lab, i) => {
    const j = plLabels.indexOf(lab);
    return { label: lab, cfo: cf.cfo[i], pat: j >= 0 ? pl.netProfit[j] : null };
  }).filter((r) => r.cfo != null && r.pat != null);
  if (aligned.length < 2) return null;
  const make = (n) => {
    const slice = aligned.slice(Math.max(0, aligned.length - n));
    if (slice.length < Math.min(2, n)) return null;
    return { labels: slice.map((r) => r.label), cfo: slice.map((r) => r.cfo), pat: slice.map((r) => r.pat) };
  };
  const out = {};
  const v3 = make(3); if (v3) out['3Y'] = v3;
  const v5 = make(5); if (v5) out['5Y'] = v5;
  return Object.keys(out).length ? out : null;
}

function deriveWc(ratios) {
  if (!ratios || !ratios.years) return null;
  const fyLabel = (y) => {
    const m = String(y).match(/(?:FY\s*)?'?(\d{2})\b|(?:Mar|FY)\s*(\d{4})/i);
    const yy = m && (m[1] || (m[2] ? m[2].slice(2) : null));
    return yy ? `FY${yy}` : String(y);
  };
  const labels = ratios.years.map(fyLabel);
  const dso = ratios.debtorDays;
  const dpo = ratios.daysPayable;
  const nwc = ratios.workingCapitalDays;
  if (!dso && !dpo && !nwc) return null;
  const make = (n) => {
    const lab = lastN(labels, n);
    if (!lab) return null;
    return {
      labels: lab,
      dso: dso ? lastN(dso, n) : null,
      dpo: dpo ? lastN(dpo, n) : null,
      nwc: nwc ? lastN(nwc, n) : null,
    };
  };
  const out = {};
  const v5 = make(5); if (v5) out['5Y'] = v5;
  const v10 = make(10); if (v10) out['10Y'] = v10;
  return Object.keys(out).length ? out : null;
}

function deriveReturns(ratios) {
  if (!ratios || !ratios.roce) return null;
  const fyLabel = (y) => {
    const m = String(y).match(/(?:FY\s*)?'?(\d{2})\b|(?:Mar|FY)\s*(\d{4})/i);
    const yy = m && (m[1] || (m[2] ? m[2].slice(2) : null));
    return yy ? `FY${yy}` : String(y);
  };
  const labels = ratios.years.map(fyLabel);
  const make = (n) => {
    const lab = lastN(labels, n);
    if (!lab) return null;
    return { labels: lab, roce: lastN(ratios.roce, n) };
  };
  const out = {};
  const v3 = make(3); if (v3) out['3Y'] = v3;
  const v5 = make(5); if (v5) out['5Y'] = v5;
  return Object.keys(out).length ? out : null;
}

// Shareholding: Screener shows quarter columns like "Mar 2024", "Jun 2024" ...
// The dashboard wants 3Y (12 quarters) and 5Y (yearly) and 10Y (yearly).
function deriveOwnership(shp) {
  if (!shp || !shp.quarters) return null;
  const labels = shp.quarters.map((q) => {
    // "Mar 2024" -> "Q4FY24", "Jun 2024" -> "Q1FY25", etc.
    const m = q.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})/i);
    if (!m) return q;
    const month = m[1].toLowerCase().slice(0, 3);
    const yr = parseInt(m[2], 10);
    const qMap = { mar: { q: 4, fy: yr }, jun: { q: 1, fy: yr + 1 }, sep: { q: 2, fy: yr + 1 }, dec: { q: 3, fy: yr + 1 } };
    const e = qMap[month];
    return e ? `Q${e.q}FY${String(e.fy).slice(2)}` : q;
  });
  const last = (arr, n) => (arr ? arr.slice(Math.max(0, arr.length - n)) : null);

  // Promoter/FII/DII history — quarterly (last 12 quarters = 3Y)
  const promoterTrend = (n) => {
    const lab = last(labels, n);
    if (!lab || !shp.promoter) return null;
    return { labels: lab, data: last(shp.promoter, n) };
  };
  const ownTrend = (n) => {
    const lab = last(labels, n);
    if (!lab) return null;
    return {
      labels: lab,
      promoter: shp.promoter ? last(shp.promoter, n) : null,
      fii: shp.fii ? last(shp.fii, n) : null,
      dii: shp.dii ? last(shp.dii, n) : null,
    };
  };

  // Yearly view — pick March-ending quarters for 5Y and 10Y series.
  const marchIdx = labels.map((l, i) => /^Q4FY/i.test(l) ? i : -1).filter((i) => i >= 0);
  const annualSlice = (n) => {
    const idxs = marchIdx.slice(Math.max(0, marchIdx.length - n));
    if (idxs.length < 2) return null;
    return {
      labels: idxs.map((i) => labels[i].replace(/^Q4/, '')),
      promoter: shp.promoter ? idxs.map((i) => shp.promoter[i]) : null,
      fii: shp.fii ? idxs.map((i) => shp.fii[i]) : null,
      dii: shp.dii ? idxs.map((i) => shp.dii[i]) : null,
    };
  };

  const promoterHolding = {};
  const p3 = promoterTrend(12); if (p3) promoterHolding['3Y'] = p3;
  const p5 = annualSlice(5); if (p5) promoterHolding['5Y'] = { labels: p5.labels, data: p5.promoter };
  const p10 = annualSlice(10); if (p10) promoterHolding['10Y'] = { labels: p10.labels, data: p10.promoter };

  const ownershipTrend = {};
  const o3 = ownTrend(12); if (o3) ownershipTrend['3Y'] = o3;
  const o5 = annualSlice(5); if (o5) ownershipTrend['5Y'] = { labels: o5.labels, fii: o5.fii, dii: o5.dii, promoter: o5.promoter };

  return { promoterHolding, ownershipTrend };
}

// ----------------------------------------------------------------------------
// Per-company refresh
// ----------------------------------------------------------------------------
async function refreshCompany(slug, ticker = slug) {
  const html = await fetchScreenerHtml(slug);
  return {
    html, // returned so we can dump on-demand debugging if needed
    summary: parseTopRatios(html),
    profitLoss: parseProfitLoss(html, `${ticker} P&L`),
    quarterly: parseQuarters(html, `${ticker} Q`),
    cashFlow: parseCashFlow(html, `${ticker} CF`),
    ratios: parseRatios(html),
    shareholding: parseShareholding(html, `${ticker} SHP`),
    bizMix: parseMixTable(html, /Segment[-\s]?wise(?:\s*Revenue)?/i),
    geoMix: parseMixTable(html, /Geograph(?:ic|y)(?:\s*Revenue)?/i),
  };
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
async function main() {
  const raw = await readFile(DATA_FILE, 'utf8');
  const json = JSON.parse(raw);
  json.summary = json.summary || {};
  json.profitLoss = json.profitLoss || {};
  json.quarterly = json.quarterly || {};
  json.cashFlow = json.cashFlow || {};
  json.ratios = json.ratios || {};
  json.shareholdingHistory = json.shareholdingHistory || {};
  json.derived = { revPat: {}, marginTrend: {}, cfoPat: {}, wc: {}, returns: {}, promoterHolding: {}, ownershipTrend: {} };
  json.financialMetrics = json.financialMetrics || {};
  json.ownership = json.ownership || {};

  const tickers = Object.keys(json.companies);
  console.log(`Refreshing ${tickers.length} companies from screener.in${COOKIE ? ' (with cookie)' : ' (no cookie — limited to ~5y)'} ...`);

  let refreshed = 0, failed = 0;

  for (const ticker of tickers) {
    const slug = json.companies[ticker].screenerSlug;
    console.log(`  ${ticker.padEnd(12)} (${slug.padEnd(14)})`);
    try {
      const got = await refreshCompany(slug, ticker);

      // Raw sections
      if (got.summary && Object.keys(got.summary).length) {
        json.summary[ticker] = { ...got.summary, source: 'screener.in' };
      }
      if (got.profitLoss) json.profitLoss[ticker] = { ...got.profitLoss, source: 'screener.in' };
      if (got.quarterly) json.quarterly[ticker] = { ...got.quarterly, source: 'screener.in' };
      if (got.cashFlow) json.cashFlow[ticker] = { ...got.cashFlow, source: 'screener.in' };
      if (got.ratios) json.ratios[ticker] = { ...got.ratios, source: 'screener.in' };
      if (got.shareholding) json.shareholdingHistory[ticker] = { ...got.shareholding, source: 'screener.in' };
      if (got.bizMix) json.bizMix[ticker] = got.bizMix;
      if (got.geoMix) json.geoMix[ticker] = got.geoMix;

      // Derived series
      const revPat = deriveRevPat(got.profitLoss);
      if (revPat) json.derived.revPat[ticker] = revPat;
      const margin = deriveMarginTrend(got.profitLoss);
      if (margin) json.derived.marginTrend[ticker] = margin;
      const cfo = deriveCfoPat(got.profitLoss, got.cashFlow);
      if (cfo) json.derived.cfoPat[ticker] = cfo;
      const wc = deriveWc(got.ratios);
      if (wc) json.derived.wc[ticker] = wc;
      const ret = deriveReturns(got.ratios);
      if (ret) json.derived.returns[ticker] = ret;
      const own = deriveOwnership(got.shareholding);
      if (own?.promoterHolding && Object.keys(own.promoterHolding).length) json.derived.promoterHolding[ticker] = own.promoterHolding;
      if (own?.ownershipTrend && Object.keys(own.ownershipTrend).length) json.derived.ownershipTrend[ticker] = own.ownershipTrend;

      // Legacy compatibility — produce [TTM-or-latest, prev-FY, prev-prev-FY].
      if (got.profitLoss?.netProfit && got.profitLoss?.sales) {
        const isTtm = (h) => /\bTTM\b/i.test(h || '');
        const years = got.profitLoss.years || [];
        const ttmIdx = years.findIndex(isTtm);
        const sales = got.profitLoss.sales;
        const np = got.profitLoss.netProfit;
        const fyIdxs = years.map((_, i) => i).filter((i) => !isTtm(years[i]));
        const lastFy = fyIdxs.slice(-3).reverse(); // [latest, prev, prev-prev]
        const ttmRev = ttmIdx >= 0 ? sales[ttmIdx] : null;
        const ttmNp = ttmIdx >= 0 ? np[ttmIdx] : null;
        const revs = [ttmRev != null ? ttmRev : sales[lastFy[0]], sales[lastFy[1]], sales[lastFy[2]]].filter((v) => v != null);
        const nps = [ttmNp != null ? ttmNp : np[lastFy[0]], np[lastFy[1]], np[lastFy[2]]].filter((v) => v != null);
        if (revs.length) json.financialMetrics[ticker] = { revenue: revs, netProfit: nps, source: 'screener.in' };
      }
      if (got.shareholding) {
        const lastIdx = (got.shareholding.quarters?.length || 0) - 1;
        if (lastIdx >= 0) {
          const own = {};
          if (got.shareholding.promoter?.[lastIdx] != null) own.promoter = got.shareholding.promoter[lastIdx];
          if (got.shareholding.fii?.[lastIdx] != null) own.fii = got.shareholding.fii[lastIdx];
          if (got.shareholding.dii?.[lastIdx] != null) own.dii = got.shareholding.dii[lastIdx];
          if (Object.keys(own).length) json.ownership[ticker] = { ...own, source: 'screener.in' };
        }
      }

      const tags = [
        got.summary && Object.keys(got.summary).length ? 'summary' : null,
        got.profitLoss && 'P&L',
        got.cashFlow?.cfo && 'CF',
        got.ratios && 'ratios',
        got.shareholding && 'shp',
        got.quarterly?.sales && 'Q',
        got.bizMix && 'biz',
        got.geoMix && 'geo',
      ].filter(Boolean);
      console.log(`    -> ${tags.length ? `ok (${tags.join('+')})` : 'no tables found (kept seed)'}`);
      if (tags.length) refreshed++; else failed++;
    } catch (err) {
      console.log(`failed: ${err.message}`);
      failed++;
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  json._meta = json._meta || {};
  json._meta.lastUpdated = new Date().toISOString().slice(0, 10);
  json._meta.status = refreshed === tickers.length ? 'live' : (refreshed > 0 ? 'partial' : 'seed');
  json._meta.schemaVersion = 3;
  json._meta.sources = {
    primary: 'Screener.in (screener.in/company/{slug}/consolidated/)',
    fetcher: 'scripts/fetch-company-data.mjs',
    dataTypes: ['summary', 'profitLoss', 'quarterly', 'cashFlow', 'ratios', 'shareholdingHistory', 'derived', 'bizMix', 'geoMix', 'financialMetrics', 'ownership'],
  };

  await writeFile(DATA_FILE, JSON.stringify(json, null, 2) + '\n');
  console.log(`\nDone. refreshed=${refreshed} failed=${failed} -> ${DATA_FILE}`);
  if (refreshed === 0) {
    console.log('\nHint: if every company failed with HTTP 403, Screener is blocking the request.');
    console.log("Open https://www.screener.in in your browser, log in, copy the cookies,");
    console.log("then re-run with:  COOKIE='csrftoken=...; sessionid=...' node scripts/fetch-company-data.mjs");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
