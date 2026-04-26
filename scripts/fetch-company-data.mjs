#!/usr/bin/env node
// Refresh data/companies.json from public sources.
//
//   Usage:  node scripts/fetch-company-data.mjs
//
// What it does:
//   1. Reads data/companies.json (preserving _meta.note + companies metadata).
//   2. For every company in `companies`, fetches its Screener.in consolidated
//      page and tries to parse the segment-revenue table — which is the
//      only public source that exposes industry-vertical / geography
//      splits in a structured form for Indian listed companies.
//   3. Writes the parsed FY25 + FY23 splits back into bizMix / geoMix.
//   4. Stamps `_meta.lastUpdated` and per-entry `source = "screener.in"`
//      for every entry it actually refreshed; entries it could not fetch
//      keep their previous values and `source = "seed"`.
//
// Notes:
//   * Screener.in's page structure changes occasionally. If the parser
//     breaks for a particular company, fix the regex below or fall back
//     to manually editing data/companies.json (in which case set
//     source = "manual:<source url>" for an audit trail).
//   * Screener serves data only to browsers — we send a real User-Agent.
//     If you hit 403, you may need to log in once in your browser and
//     copy the `csrftoken` / `sessionid` cookies into the COOKIE env var:
//
//       COOKIE='csrftoken=...; sessionid=...' node scripts/fetch-company-data.mjs
//
// This script intentionally has zero npm dependencies — it uses only
// Node 18+ built-ins (fetch + URL).

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '..', 'data', 'companies.json');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const COOKIE = process.env.COOKIE || '';

const COLOR_PALETTE = [
  '#6366f1', '#10b981', '#f59e0b', '#3b82f6',
  '#ec4899', '#14b8a6', '#94a3b8', '#a855f7'
];

async function fetchScreenerHtml(slug) {
  const url = `https://www.screener.in/company/${slug}/consolidated/`;
  const headers = { 'User-Agent': UA, 'Accept': 'text/html,*/*' };
  if (COOKIE) headers['Cookie'] = COOKIE;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  return res.text();
}

// Screener renders segment + geography breakdowns inside the
// "Segment-wise Revenue" / "Geographic Revenue" sections, typically as
// `data-` attributes on <table> rows or as inline JSON. The exact
// selectors drift between releases, so we look for any table whose
// header mentions either word and parse the FY25 + FY23 columns.
function parseMixTable(html, sectionTitleRegex) {
  const sectionRe = new RegExp(`<h\\d[^>]*>\\s*${sectionTitleRegex.source}[\\s\\S]*?</table>`, 'i');
  const section = html.match(sectionRe);
  if (!section) return null;

  const rows = [...section[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  if (rows.length < 2) return null;

  // Header row -> find FY25 and FY23 column indices
  const headerCells = [...rows[0][1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map(m =>
    m[1].replace(/<[^>]+>/g, '').trim()
  );
  const idxFY25 = headerCells.findIndex(h => /FY\s*25|Mar\s*25|2024[-\s]?25/i.test(h));
  const idxFY23 = headerCells.findIndex(h => /FY\s*23|Mar\s*23|2022[-\s]?23/i.test(h));
  if (idxFY25 < 0 || idxFY23 < 0) return null;

  const labels = [];
  const fy25 = [];
  const fy23 = [];
  for (const row of rows.slice(1)) {
    const cells = [...row[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map(m =>
      m[1].replace(/<[^>]+>/g, '').trim()
    );
    if (!cells.length) continue;
    const label = cells[0];
    const v25 = parseFloat(cells[idxFY25]?.replace(/[%,\s]/g, ''));
    const v23 = parseFloat(cells[idxFY23]?.replace(/[%,\s]/g, ''));
    if (!label || /total/i.test(label) || isNaN(v25) || isNaN(v23)) continue;
    labels.push(label);
    fy25.push(v25);
    fy23.push(v23);
  }
  if (!labels.length) return null;

  // Normalize to percentages summing to 100 (Screener sometimes shows abs values)
  const norm = (arr) => {
    const sum = arr.reduce((a, b) => a + b, 0);
    if (sum > 90 && sum < 110) return arr;            // already %
    return arr.map(v => +(v * 100 / sum).toFixed(1)); // convert abs -> %
  };

  const colors = labels.map((_, i) => COLOR_PALETTE[i % COLOR_PALETTE.length]);
  return {
    FY25: { labels, data: norm(fy25), colors, source: 'screener.in' },
    FY23: { labels, data: norm(fy23), colors, source: 'screener.in' }
  };
}

async function refreshCompany(slug) {
  const html = await fetchScreenerHtml(slug);
  const biz = parseMixTable(html, /Segment[-\s]?wise(?:\s*Revenue)?/i);
  const geo = parseMixTable(html, /Geograph(?:ic|y)(?:\s*Revenue)?/i);
  return { biz, geo };
}

async function main() {
  const raw = await readFile(DATA_FILE, 'utf8');
  const json = JSON.parse(raw);

  const tickers = Object.keys(json.companies);
  console.log(`Refreshing ${tickers.length} companies from screener.in ...`);

  let refreshed = 0;
  let failed = 0;

  for (const ticker of tickers) {
    const slug = json.companies[ticker].screenerSlug;
    process.stdout.write(`  ${ticker} (${slug}) ... `);
    try {
      const { biz, geo } = await refreshCompany(slug);
      if (biz) { json.bizMix[ticker] = biz; }
      if (geo) { json.geoMix[ticker] = geo; }
      const got = [biz && 'bizMix', geo && 'geoMix'].filter(Boolean).join(' + ') || 'nothing';
      console.log(got === 'nothing' ? `no tables found (kept seed)` : `ok (${got})`);
      if (biz || geo) refreshed++; else failed++;
    } catch (err) {
      console.log(`failed: ${err.message}`);
      failed++;
    }
    // be polite
    await new Promise(r => setTimeout(r, 800));
  }

  json._meta = json._meta || {};
  json._meta.lastUpdated = new Date().toISOString().slice(0, 10);
  json._meta.status = refreshed === tickers.length ? 'live' : (refreshed > 0 ? 'partial' : 'seed');

  await writeFile(DATA_FILE, JSON.stringify(json, null, 2) + '\n');
  console.log(`\nDone. refreshed=${refreshed} failed=${failed} -> ${DATA_FILE}`);
  if (refreshed === 0) {
    console.log('\nHint: if every company failed with HTTP 403, Screener is blocking the request.');
    console.log('Open https://www.screener.in in your browser, log in, copy the cookies,');
    console.log('then re-run with:  COOKIE=\'csrftoken=...; sessionid=...\' node scripts/fetch-company-data.mjs');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
