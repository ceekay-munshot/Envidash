/* ===== ASK AI — TOOL CATALOG =====
 *
 * Port of `agent/tools.ts` from the dashboard skill
 * (reference/chat-agent.md section 2). Classic script, no bundler; the shape
 * of each tool is identical to the reference.
 *
 * WRITE PER DASHBOARD. One tool per datasource the dashboard uses. Every
 * run() wraps a fetch function from js/lib/munshot-api.js — never a second
 * API client.
 *
 * HARD RULE: read-only tools only. Never add a write-capable datasource
 * (email_send, agent_run, anything that sends, writes or deletes). An injected
 * instruction inside fetched text must never be able to cause an action.
 *
 * Every run() coerces its args before use — arg values are chosen by the model
 * and can arrive as numbers, objects or null. A missing required value throws
 * a plain-language Error, which runAgent passes to the answer model as
 * unavailable data so the rest of the answer still works.
 *
 * Exposed as window.MunshotDashboard.agent.tools.
 */
'use strict';

(function () {
  var ns = (window.MunshotDashboard = window.MunshotDashboard || {});
  var agent = (ns.agent = ns.agent || {});

  function api() {
    var a = ns.api;
    if (!a) throw new Error('The dashboard data client is not available right now.');
    return a;
  }

  function text(value) {
    if (typeof value === 'string') return value.trim();
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return '';
    return String(value).trim();
  }

  function required(value, label) {
    var v = text(value);
    if (!v) throw new Error('No ' + label + ' was available for this request.');
    return v;
  }

  function oneOf(value, allowed, fallback) {
    var v = text(value).toLowerCase();
    return allowed.indexOf(v) >= 0 ? v : fallback;
  }

  /** Ticker as the Munshot APIs want it — "NSE: INFY" and "infy" both become "INFY". */
  function cleanTicker(value, label) {
    var raw = required(value, label);
    var parts = raw.split(':');
    return parts[parts.length - 1].trim().toUpperCase();
  }

  /** YYYY-MM-DD, N days before today. */
  function daysAgo(days) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  /** Pick the slice of data/companies.json that belongs to one ticker. */
  function sliceDataset(json, ticker) {
    if (!json || typeof json !== 'object') return json;
    var groups = [
      'companies',
      'bizMix',
      'geoMix',
      'financialMetrics',
      'ownership',
      'summary',
      'profitLoss',
      'quarterly',
      'cashFlow',
      'ratios',
      'shareholdingHistory',
    ];
    var out = { _meta: json._meta || null, ticker: ticker };
    groups.forEach(function (group) {
      var value = json[group] && json[group][ticker];
      if (value !== undefined) out[group] = value;
    });
    // `derived` is keyed kind -> ticker -> period.
    if (json.derived && typeof json.derived === 'object') {
      var derived = {};
      Object.keys(json.derived).forEach(function (kind) {
        var value = json.derived[kind] && json.derived[kind][ticker];
        if (value !== undefined) derived[kind] = value;
      });
      if (Object.keys(derived).length) out.derived = derived;
    }
    return out;
  }

  agent.tools = [
    {
      name: 'get_dashboard_dataset',
      section: 'Business & Market',
      description:
        'The dashboard’s own refreshed dataset for the selected company: business/service ' +
        'mix, geography mix, headline financial metrics, shareholding split, profit & loss, ' +
        'quarterly results, cash flow, key ratios and the derived trend series behind the ' +
        'charts. Use for questions about what a chart or panel on this dashboard is showing, ' +
        'revenue or segment mix, geography split, or how fresh the dashboard data is.',
      args: {
        ticker: { type: 'string', required: true, from: 'filter:ticker' },
      },
      run: function (args) {
        var ticker = cleanTicker(args.ticker, 'company ticker');
        return api()
          .fetchDashboardData()
          .then(function (json) {
            return sliceDataset(json, ticker);
          });
      },
    },

    {
      name: 'get_company_financials',
      section: 'Financial Quality',
      description:
        'Full reported financials for the company: profit & loss, balance sheet, quarterly ' +
        'results, key ratios, shareholding pattern, peer comparison and the pros/cons ' +
        'summary. Use for questions about revenue, profit, margins, debt, borrowings, cash ' +
        'flow, return ratios, working capital, growth rates, valuation multiples or how the ' +
        'company compares with its peers.',
      args: {
        ticker: { type: 'string', required: true, from: 'filter:ticker' },
        country: { type: 'string', required: true, from: 'filter:country' },
        q: {
          type: 'string',
          required: false,
          enum: ['consolidated', 'standalone'],
          default: 'consolidated',
        },
        period: { type: 'string', required: false, enum: ['annual', 'quarterly'] },
      },
      run: function (args, token) {
        return api().fetchCombinedFinancials(
          {
            ticker: cleanTicker(args.ticker, 'company ticker'),
            country: required(args.country, 'country'),
            q: oneOf(args.q, ['consolidated', 'standalone'], 'consolidated'),
            period: oneOf(args.period, ['annual', 'quarterly'], ''),
          },
          token
        );
      },
    },

    {
      name: 'get_insider_trades',
      section: 'Promoter & Mgmt',
      description:
        'Insider and promoter buy/sell transactions for the company over a date range, with ' +
        'who traded, the quantity, the value and the resulting holding. Use for questions ' +
        'about insider activity, promoter buying or selling, pledging behaviour, or whether ' +
        'management has been adding to or trimming its stake.',
      args: {
        ticker: { type: 'string', required: true, from: 'filter:ticker' },
        country: { type: 'string', required: true, from: 'filter:country' },
        fromDate: { type: 'string', required: false },
        toDate: { type: 'string', required: false },
      },
      run: function (args, token) {
        var country = required(args.country, 'country');
        return api().fetchInsiderTrades(
          {
            ticker: cleanTicker(args.ticker, 'company ticker'),
            // The endpoint routes on the literal value "india".
            country: country.toLowerCase() === 'india' ? 'india' : country,
            fromDate: text(args.fromDate),
            toDate: text(args.toDate),
          },
          token
        );
      },
    },

    {
      name: 'get_filings_and_announcements',
      section: 'Governance & Flags',
      description:
        'Regulatory filings, exchange announcements, concall transcripts, annual reports and ' +
        'earnings documents for the company, newest first. Use for questions about what the ' +
        'company has disclosed or announced, auditor or board changes, litigation and ' +
        'regulatory notices, related-party disclosures, corporate actions, or where to read ' +
        'the source document.',
      args: {
        ticker: { type: 'string', required: true, from: 'filter:ticker' },
        country: { type: 'string', required: true, from: 'filter:country' },
        form: {
          type: 'string',
          required: false,
          enum: ['all', 'concalls', 'annual_report', 'earnings_report'],
          default: 'all',
        },
        startDate: { type: 'string', required: false },
        endDate: { type: 'string', required: false },
      },
      run: function (args, token) {
        return api().fetchFilingsAnnouncements(
          {
            ticker: cleanTicker(args.ticker, 'company ticker'),
            country: required(args.country, 'country'),
            form: oneOf(args.form, ['all', 'concalls', 'annual_report', 'earnings_report'], 'all'),
            startDate: text(args.startDate) || daysAgo(365),
            endDate: text(args.endDate) || today(),
          },
          token
        );
      },
    },

    {
      name: 'get_live_quote',
      section: 'Ownership & Valuation',
      description:
        'Current market quote for the company — last price, day move, market cap, P/E and ' +
        'the other headline metrics shown in the hero bar. Use for questions about what the ' +
        'stock is trading at now, how it moved today, or its current market cap or multiple.',
      args: {
        ticker: { type: 'string', required: true, from: 'filter:ticker' },
        country: { type: 'string', required: false, from: 'filter:country' },
      },
      run: function (args) {
        return api().fetchStockQuote({
          ticker: cleanTicker(args.ticker, 'company ticker'),
          country: text(args.country),
          type: 'stockquote',
        });
      },
    },

    {
      name: 'get_company_news',
      section: 'Ground Checks',
      description:
        'Recent news articles about the company or its industry, with headline, source and ' +
        'link. Use for questions about what has happened lately, management commentary in ' +
        'the press, plant or capacity news, regulatory or tax actions, credit-rating changes, ' +
        'or anything that would verify the company’s operations on the ground.',
      args: {
        query: { type: 'string', required: true },
        country: { type: 'string', required: false, from: 'filter:country' },
        fromDate: { type: 'string', required: false },
        toDate: { type: 'string', required: false },
      },
      run: function (args, token) {
        return api().fetchNews(
          {
            query: required(args.query, 'search query'),
            country: text(args.country),
            fromDate: text(args.fromDate),
            toDate: text(args.toDate),
          },
          token
        );
      },
    },
  ];
})();
