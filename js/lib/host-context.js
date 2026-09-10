/* ===== HOST CONTEXT (useHostContext) =====
 *
 * Port of the reference `src/hooks/useHostContext.ts` from the dashboard skill
 * (reference/auth-standards.md section 4). The React hook keeps host context in
 * component state; ForensIQ has no React, so the same logic lives in one
 * module-level store that consumers subscribe to.
 *
 * The contract is unchanged:
 *   - read whatever the SDK has already cached via sdk.getContext()
 *   - re-sync on EVERY host message via sdk.onMessage(sync)
 *   - never call sdk.ready() and never call/await sdk.requestContext()
 *     (requestContext returns a boolean, not the context)
 *
 * Usage:
 *   const off = MunshotDashboard.useHostContext(state => { ... });  // fires immediately
 *   const { session, ticker } = MunshotDashboard.getHostContext();
 */
'use strict';

(function () {
  var ns = (window.MunshotDashboard = window.MunshotDashboard || {});
  var sdk = ns.sdk;

  var EMPTY_SESSION = {
    token: null,
    userName: null,
    email: null,
    orgId: null,
    orgName: null,
  };

  var state = {
    session: EMPTY_SESSION,
    ticker: null,
    tickerCompany: null,
    tickerCountry: null,
    selectedSymbol: null,
  };

  var listeners = [];

  function snapshot() {
    return {
      session: state.session,
      ticker: state.ticker,
      tickerCompany: state.tickerCompany,
      tickerCountry: state.tickerCountry,
      selectedSymbol: state.selectedSymbol,
    };
  }

  function emit() {
    var current = snapshot();
    listeners.slice().forEach(function (fn) {
      try {
        fn(current);
      } catch (err) {
        // A broken consumer must never break the host message pump.
        console.error('[ForensIQ] host context listener failed', err);
      }
    });
  }

  function sync() {
    var ctx = sdk.getContext();
    if (!ctx) return;

    var changed = false;

    if (ctx.session) {
      var next = {
        token: ctx.session.token != null ? ctx.session.token : null,
        userName: ctx.session.userName != null ? ctx.session.userName : null,
        email: ctx.session.email != null ? ctx.session.email : null,
        orgId: ctx.session.orgId != null ? ctx.session.orgId : null,
        orgName: ctx.session.orgName != null ? ctx.session.orgName : null,
      };
      var prev = state.session;
      if (
        next.token !== prev.token ||
        next.userName !== prev.userName ||
        next.email !== prev.email ||
        next.orgId !== prev.orgId ||
        next.orgName !== prev.orgName
      ) {
        state.session = next;
        changed = true;
      }
    }

    if (ctx.market) {
      var ticker = ctx.market.selectedTicker != null ? ctx.market.selectedTicker : null;
      var company = ctx.market.selectedTickerCompany != null ? ctx.market.selectedTickerCompany : null;
      var country = ctx.market.selectedTickerCountry != null ? ctx.market.selectedTickerCountry : null;
      var symbol = ctx.market.selectedSymbol != null ? ctx.market.selectedSymbol : null;
      if (
        ticker !== state.ticker ||
        company !== state.tickerCompany ||
        country !== state.tickerCountry ||
        symbol !== state.selectedSymbol
      ) {
        state.ticker = ticker;
        state.tickerCompany = company;
        state.tickerCountry = country;
        state.selectedSymbol = symbol;
        changed = true;
      }
    }

    if (changed) emit();
  }

  // Apply already-cached context (host:init may have arrived before this file
  // ran), then re-sync on every host message. Subscribed once, at load.
  sync();
  sdk.onMessage(sync);

  /**
   * Subscribe to host session + market context.
   * The listener is invoked immediately with the current state, then on every
   * change. Returns an unsubscribe function.
   */
  ns.useHostContext = function useHostContext(listener) {
    if (typeof listener !== 'function') return function () {};
    listeners.push(listener);
    try {
      listener(snapshot());
    } catch (err) {
      console.error('[ForensIQ] host context listener failed', err);
    }
    return function off() {
      var i = listeners.indexOf(listener);
      if (i >= 0) listeners.splice(i, 1);
    };
  };

  /** Current host context snapshot (synchronous). */
  ns.getHostContext = snapshot;
})();
