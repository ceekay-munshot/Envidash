/* ===== MUNSHOT DATASOURCE CLIENT (READ-ONLY) =====
 *
 * One place for every Munshot API call this dashboard makes, so the Ask AI
 * tool catalog (js/agent/tools.js) wraps these functions instead of writing a
 * second API client — see dashboard-skill/reference/chat-agent.md.
 *
 * Only datasources registered in reference/datasource-registry.md appear here,
 * and every one of them is READ-ONLY. Nothing that sends, writes or deletes
 * (email_send, agent_run, …) may ever be added to this file, because the agent
 * calls these on behalf of the model.
 *
 * Auth: bearer token from context.session.token (auth-standards.md §7).
 *
 * Exposed as window.MunshotDashboard.api.
 */
'use strict';

(function () {
  var ns = (window.MunshotDashboard = window.MunshotDashboard || {});

  var FASTAPI_BASE = 'https://fastapi.muns.io';
  var NESTJS_BASE = 'https://devde.muns.io';

  // auth_defaults.timeout_seconds from the datasource registry.
  var TIMEOUT_MS = 30000;

  /** Never assume a value is a string — tool args are chosen by the model. */
  function asText(value) {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return '';
    return String(value);
  }

  /** Plain-language error that also carries the HTTP status for retry logic. */
  function apiError(message, status) {
    var err = new Error(message);
    if (typeof status === 'number') err.status = status;
    return err;
  }

  function requireToken(token) {
    var t = asText(token).trim();
    if (!t) throw apiError('Not signed in yet — the Munshot session has not arrived.');
    return t;
  }

  function requireValue(value, label) {
    var v = asText(value).trim();
    if (!v) throw apiError('No ' + label + ' available for this request.');
    return v;
  }

  /**
   * Several Munshot endpoints answer with markdown or plain text rather than
   * JSON (financials, insider trades, stock quotes). Decide by content-type and
   * fall back to text, so a contract change can never throw a parse error.
   */
  async function readBody(res) {
    var type = res.headers.get('content-type') || '';
    if (type.indexOf('application/json') >= 0) {
      try {
        return await res.json();
      } catch (err) {
        return '';
      }
    }
    var text = await res.text();
    if (!text) return '';
    var first = text.trim().charAt(0);
    if (first === '{' || first === '[') {
      try {
        return JSON.parse(text.trim());
      } catch (err) {
        /* not JSON after all — fall through and return the raw text */
      }
    }
    return text;
  }

  async function call(url, options, what) {
    var res;
    try {
      res = await fetch(url, {
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      var timedOut =
        err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError');
      if (timedOut) throw apiError(what + ' took too long to respond.');
      // A TypeError here means the network call itself failed — runAgent
      // retries those once.
      throw err;
    }
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw apiError(what + ' is unavailable — the Munshot session has expired.', res.status);
      }
      if (res.status === 429) {
        throw apiError(what + ' is rate limited right now.', res.status);
      }
      throw apiError(what + ' could not be loaded right now.', res.status);
    }
    return readBody(res);
  }

  function authedJson(token, body) {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + requireToken(token),
      },
      body: JSON.stringify(body),
    };
  }

  function openJson(body) {
    return {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    };
  }

  /** datasource: combined_financials — nestjs POST /filings/combined_financials */
  function fetchCombinedFinancials(args, token) {
    var body = {
      ticker: requireValue(args.ticker, 'company ticker'),
      country: requireValue(args.country, 'country'),
    };
    var q = asText(args.q).trim();
    if (q) body.q = q;
    var period = asText(args.period).trim();
    if (period) body.period = period;
    return call(
      NESTJS_BASE + '/filings/combined_financials',
      authedJson(token, body),
      'Financial data'
    );
  }

  /** datasource: insider_trades — nestjs POST /filings/data/insider_trades */
  function fetchInsiderTrades(args, token) {
    var body = {
      ticker: requireValue(args.ticker, 'company ticker'),
      country: requireValue(args.country, 'country'),
    };
    var fromDate = asText(args.fromDate).trim();
    if (fromDate) body.fromDate = fromDate;
    var toDate = asText(args.toDate).trim();
    if (toDate) body.toDate = toDate;
    return call(
      NESTJS_BASE + '/filings/data/insider_trades',
      authedJson(token, body),
      'Insider trade data'
    );
  }

  /** datasource: combined_filings_announcements — nestjs POST /filings/combined_filings_announcements */
  async function fetchFilingsAnnouncements(args, token) {
    var body = {
      ticker: requireValue(args.ticker, 'company ticker'),
      country: requireValue(args.country, 'country'),
    };
    var form = asText(args.form).trim();
    if (form && form !== 'all') body.form = [form];
    var startDate = asText(args.startDate).trim();
    if (startDate) body.start_date = startDate;
    var endDate = asText(args.endDate).trim();
    if (endDate) body.end_date = endDate;

    var data = await call(
      NESTJS_BASE + '/filings/combined_filings_announcements',
      authedJson(token, body),
      'Filings and announcements'
    );
    // Bound the payload: this endpoint can return hundreds of items and the
    // whole result is pasted into the answer prompt.
    return Array.isArray(data) ? data.slice(0, 40) : data;
  }

  /** datasource: stock_data — fastapi POST /stock-data (auth: none) */
  function fetchStockQuote(args) {
    var body = {
      ticker_symbol: requireValue(args.ticker, 'company ticker'),
      type: asText(args.type).trim() || 'stockquote',
    };
    var country = asText(args.country).trim();
    if (country) body.country = country;
    return call(FASTAPI_BASE + '/stock-data', openJson(body), 'Live quote data');
  }

  /** datasource: news_search — fastapi POST /tools/news-search */
  async function fetchNews(args, token) {
    var body = { query: requireValue(args.query, 'search query') };
    var country = asText(args.country).trim();
    if (country) body.country = country;
    var fromDate = asText(args.fromDate).trim();
    var toDate = asText(args.toDate).trim();
    // The freshness filter only applies when BOTH dates are present.
    if (fromDate && toDate) {
      body.from_date = fromDate;
      body.to_date = toDate;
    }
    var data = await call(FASTAPI_BASE + '/tools/news-search', authedJson(token, body), 'News');
    if (data && Array.isArray(data.results)) {
      return {
        query: data.query,
        results_count: data.results_count,
        results: data.results.slice(0, 10),
      };
    }
    return data;
  }

  /**
   * The dashboard's own refreshable dataset (data/companies.json) — the same
   * file loadCompanyData() reads for the Business Mix, Geography Mix,
   * financial-metric and ownership panels. Always refetched, never read back
   * from what is already rendered.
   */
  async function fetchDashboardData() {
    var res;
    try {
      res = await fetch('data/companies.json?t=' + Date.now(), { cache: 'no-store' });
    } catch (err) {
      throw apiError('The dashboard dataset could not be loaded right now.');
    }
    if (!res.ok) throw apiError('The dashboard dataset could not be loaded right now.', res.status);
    try {
      return await res.json();
    } catch (err) {
      throw apiError('The dashboard dataset could not be read right now.');
    }
  }

  ns.api = {
    FASTAPI_BASE: FASTAPI_BASE,
    NESTJS_BASE: NESTJS_BASE,
    asText: asText,
    fetchCombinedFinancials: fetchCombinedFinancials,
    fetchInsiderTrades: fetchInsiderTrades,
    fetchFilingsAnnouncements: fetchFilingsAnnouncements,
    fetchStockQuote: fetchStockQuote,
    fetchNews: fetchNews,
    fetchDashboardData: fetchDashboardData,
  };
})();
