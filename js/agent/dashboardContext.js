/* ===== ASK AI — DASHBOARD CONTEXT =====
 *
 * Port of `agent/dashboardContext.ts` from the dashboard skill
 * (reference/chat-agent.md section 1). ForensIQ is a classic-script static
 * site with no bundler, so this ships as a classic script instead of an ES
 * module — the shape of the exported object is identical.
 *
 * WRITE PER DASHBOARD. When the dashboard changes, update this file and
 * tools.js. Never edit prompts.js, runAgent.js or AskAiPanel.js.
 *
 * getFilters() MUST return live UI state, not defaults — it is what keeps the
 * agent's answers aligned with what is on screen. It reads
 * MunshotDashboard.getDashboardState(), which js/dashboard.js registers.
 *
 * Exposed as window.MunshotDashboard.agent.dashboardContext.
 */
'use strict';

(function () {
  var ns = (window.MunshotDashboard = window.MunshotDashboard || {});
  var agent = (ns.agent = ns.agent || {});

  /** Country code from the host (e.g. "IN") -> the value Munshot APIs expect. */
  function apiCountry(code) {
    var c = String(code == null ? '' : code).trim().toUpperCase();
    if (c === 'US' || c === 'USA' || c === 'UNITED STATES') return 'USA';
    // ForensIQ is an India-first dashboard; anything unknown stays India.
    return 'India';
  }

  agent.apiCountry = apiCountry;

  agent.dashboardContext = {
    name: 'ForensIQ — Forensic + Quality Investor Dashboard',
    purpose:
      'Run a forensic and quality check on a single listed company: competitive position, ' +
      'promoter and capital-allocation behaviour, financial and balance-sheet quality, ' +
      'governance and accounting red flags, operating verification, and ownership, ' +
      'valuation and risk.',

    // Every section the user can see, and what lives there.
    sections: [
      {
        name: 'Business & Market',
        describes:
          'Industry size and TAM, market-share trend, business/service mix and geography mix ' +
          'donuts, and domestic and global peer tables.',
      },
      {
        name: 'Promoter & Mgmt',
        describes:
          'Promoter holding and pledge trend, buyback history, KMP remuneration, guidance ' +
          'vs delivery, acquisition timeline and corporate actions.',
      },
      {
        name: 'Financial Quality',
        describes:
          'Revenue and PAT trend, margin trend, CFO vs PAT cash quality, working-capital ' +
          'cycle, return ratios, balance-sheet snapshot, capex and debt profile.',
      },
      {
        name: 'Governance & Flags',
        describes:
          'Forensic red-flag scorecard, auditor history, related-party transactions, legal ' +
          'proceedings and the accounting-quality checklist.',
      },
      {
        name: 'Ground Checks',
        describes:
          'Headcount vs revenue, GST compliance grid, physical operating indicators, ' +
          'facility status and debt restructuring history.',
      },
      {
        name: 'Ownership & Valuation',
        describes:
          'FII / DII / mutual-fund / promoter ownership trend, historical P/E valuation band, ' +
          'peer valuation table, catalyst timeline and the risk register.',
      },
    ],

    // Everything the user can click, toggle or select.
    controls: [
      {
        name: 'Company search',
        describes:
          'Selects which company the whole dashboard shows. Also driven by the stock ' +
          'selected in Munshot.',
      },
      {
        name: 'Section tabs',
        describes: 'Switches between the six forensic sections listed above.',
      },
      {
        name: 'Period toggles',
        describes: 'Switches each trend chart between 3Y, 5Y and 10Y.',
      },
      {
        name: 'Mix FY toggle',
        describes: 'Switches the business-mix and geography-mix donuts between financial years.',
      },
      {
        name: 'Guidance tabs',
        describes: 'Switches the guidance-vs-delivery tracker between Revenue and Margin.',
      },
      {
        name: 'Refresh',
        describes: 'Re-pulls the dashboard dataset and updates the last-refreshed timestamp.',
      },
    ],

    // MUST return current live values read from dashboard state.
    getFilters: function () {
      var state = typeof ns.getDashboardState === 'function' ? ns.getDashboardState() : null;
      if (!state) return {};

      var filters = {
        ticker: state.ticker || '',
        company: state.company || '',
        country: apiCountry(state.country),
        exchange: state.exchange || '',
        section: state.section || '',
        chartPeriod: state.chartPeriod || '',
        mixPeriod: state.mixPeriod || '',
      };

      // Drop empties so the router prompt only lists filters that are really set.
      Object.keys(filters).forEach(function (key) {
        if (!filters[key]) delete filters[key];
      });
      return filters;
    },
  };
})();
