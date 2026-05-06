// Runtime config for the dashboard. Loaded before js/dashboard.js so any
// values defined here are available on `window` when the dashboard boots.
//
// MUNS_BEARER_TOKEN is the bearer token for the Birdnest (Muns) stock-search
// API used by the company search box. Paste the raw token below — the search
// code adds the "Bearer " prefix automatically.
//
// NOTE: this is a static site, so anything placed here ships to the browser.
// Use a token scoped to read-only stock search.
window.MUNS_BEARER_TOKEN = '';

// Optional override of the API base. Leave as-is for production.
window.MUNS_API_BASE = 'https://birdnest.muns.io';
