// Runtime config for the dashboard. Loaded before js/dashboard.js so any
// values defined here are available on `window` when the dashboard boots.
//
// MUNS_BEARER_TOKEN is the bearer token for the Muns stock-search API used
// by the company search box. Paste the raw token below — the search code
// adds the "Bearer " prefix automatically.
//
// NOTE: this is a static site, so anything placed here ships to the browser.
// Use a token scoped to read-only stock search.
window.MUNS_BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZWE5ZGMyYi0xZDBmLTQ2MzctOGE2Ny0wM2VhNzFmMGYyY2YiLCJlbWFpbCI6Im5hZGFtc2FsdWphQGdtYWlsLmNvbSIsIm9yZ0lkIjoiMSIsImF1dGhvcml0eSI6ImFkbWluIiwiaWF0IjoxNzc4NDM0MDY4LCJleHAiOjE3Nzg4NjYwNjh9.uqQ3uVj2JcwpF3eoaZ2VZ5kMaa2U1Pm47nC9ejHo1rQ';

// Optional override of the API base. Leave as-is for production.
window.MUNS_API_BASE = 'https://birdnest.muns.io';
