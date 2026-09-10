// Cloudflare Worker entrypoint.
// - Every request goes through the embed-protection guard first
//   (functions/_middleware.js), which redirects direct-tab access and framing
//   from non-Munshot origins. Requires `run_worker_first` in wrangler.toml so
//   the Worker sees document requests before the asset router answers them.
// - Everything allowed through falls through to the static assets bundled with
//   the site.
//
// There is no API proxy here any more: Munshot APIs are called directly from
// the browser with the session token the Munshot host hands the dashboard over
// the Dashboard SDK (context.session.token). The dashboard must not carry its
// own server-side credentials — see dashboard-skill/reference/auth-standards.md.

import { onRequest as embedGuard } from './functions/_middleware.js';

export default {
  async fetch(request, env) {
    return embedGuard({
      request,
      next: () => env.ASSETS.fetch(request),
    });
  },
};
