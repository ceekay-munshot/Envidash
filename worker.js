// Cloudflare Worker entrypoint.
// - POST /api/stock/search → proxied to Muns with server-side bearer token
//   so the JWT never ships to the browser.
// - Everything else falls through to the static assets bundled with the site.

const MUNS_SEARCH_URL = 'https://devde.muns.io/stock/search';
const STATIC_USER_INDEX = 124;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/stock/search') {
      return handleStockSearch(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleStockSearch(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { 'Allow': 'POST' },
    });
  }

  if (!env.MUNS_ACCESS_TOKEN) {
    return jsonError(500, 'MUNS_ACCESS_TOKEN is not configured on the worker.');
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Request body must be valid JSON.');
  }

  const query = typeof body?.query === 'string' ? body.query : '';

  const upstream = await fetch(MUNS_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.MUNS_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, user_index: STATIC_USER_INDEX }),
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
    },
  });
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
