/* ===== MUNSHOT DASHBOARD SDK CLIENT ADAPTER =====
 *
 * Port of the reference `src/lib/sdk.ts` from the dashboard skill
 * (reference/auth-standards.md section 3). ForensIQ is a classic-script
 * static site with no bundler, so this ships as a classic script instead of
 * an ES module — the contract is identical:
 *
 *   - ONE client, created at load time (before dashboard.js runs), so the
 *     SDK's window 'message' listener is live before host:init can arrive.
 *   - autoReady left at its default (true). The SDK sends dashboard:ready
 *     itself from inside its host:init handler. Never call sdk.ready().
 *
 * Load order (see index.html <head>):
 *   1. munshot-dashboard-sdk.v1.0.0.min.js   (classic, defines the global)
 *   2. js/lib/sdk.js                         (this file — creates the client)
 *   3. js/lib/host-context.js                (useHostContext equivalent)
 *
 * Exposed as window.MunshotDashboard.sdk.
 */
'use strict';

(function () {
  var DASHBOARD_ID = 'forensiq-dashboard';
  var DASHBOARD_NAME = 'ForensIQ — Forensic + Quality Investor Dashboard';

  /**
   * @typedef {Object} SessionContext
   * @property {string|null} token      JWT bearer token for Munshot APIs
   * @property {string|null} userName
   * @property {string|null} email
   * @property {string|null} orgId
   * @property {string|null} orgName
   */

  /**
   * @typedef {Object} MarketContext
   * @property {string|null} selectedTicker         e.g. "INFY"
   * @property {string|null} selectedTickerCompany  e.g. "Infosys Ltd."
   * @property {string|null} selectedTickerCountry  e.g. "IN"
   * @property {string|null} selectedSymbol         TradingView, e.g. "NSE:INFY"
   */

  /**
   * @typedef {Object} AppContext
   * @property {string|null} route
   * @property {string|null} query
   * @property {string|null} viewMode
   * @property {string|null} selectedCategory
   * @property {string|null} searchQuery
   */

  /**
   * @typedef {Object} DashboardHostContext
   * @property {SessionContext} [session]
   * @property {MarketContext}  [market]
   * @property {AppContext}     [app]
   */

  // Faithful no-op, used ONLY when the SDK script is absent (e.g. serving the
  // site standalone outside the Munshot host). Return types match the real
  // client so app code behaves identically.
  function createNoopSdk() {
    var noop = function () {};
    return {
      getContext: function () { return null; },
      getChannelId: function () { return null; },
      onMessage: function () { return noop; },
      onTopic: function () { return noop; },
      onRequest: function () { return noop; },
      ready: function () { return false; },
      requestContext: function () { return false; },
      publish: function () { return false; },
      request: function () { return Promise.resolve(null); },
      sendError: function () { return false; },
      destroy: noop,
    };
  }

  function initSdk() {
    var g = window.MunshotDashboardSDK;
    var config = {
      dashboardId: DASHBOARD_ID,
      dashboardName: DASHBOARD_NAME,
      // Leave autoReady default (true). The SDK sends dashboard:ready itself
      // from inside its host:init handler, once it knows the channelId.
    };

    var factory = (g && g.createDashboardClientSdk) || (g && g.createClient);
    if (typeof factory === 'function') {
      try {
        return factory(config);
      } catch (err) {
        console.error('[ForensIQ] SDK factory failed', err);
      }
    }

    var Ctor = (g && g.DashboardClientSdk) || (g && g.Client);
    if (typeof Ctor === 'function') {
      try {
        return new Ctor(config);
      } catch (err) {
        console.error('[ForensIQ] SDK constructor failed', err);
      }
    }

    console.warn(
      '[ForensIQ] MunshotDashboardSDK not found; using no-op SDK. ' +
        'Expected only when running outside the Munshot host iframe.'
    );
    return createNoopSdk();
  }

  // Single client for the whole app. Created at load time so its message
  // listener is live before host:init can arrive.
  var sdk = initSdk();

  window.MunshotDashboard = window.MunshotDashboard || {};
  window.MunshotDashboard.sdk = sdk;
  window.MunshotDashboard.DASHBOARD_ID = DASHBOARD_ID;
  window.MunshotDashboard.DASHBOARD_NAME = DASHBOARD_NAME;
})();
