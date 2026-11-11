// Where the site's backend lives: /api on the site's own origin. The site's server (scripts/serve.ts
// in development, a reverse proxy in production) relays /api/* to the backend, so the session cookie
// is first-party and there is no CORS.

export const API_BASE = '/api';

/** Sent as X-Requested-With on every write; the backend refuses a write without it. */
export const CLIENT_HEADER = 'canvas-assistant';
