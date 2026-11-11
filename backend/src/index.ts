// API entry point. Reports env status at boot, mounts one Hono router per feature area, and
// defines the top-level onError. The router import names/paths below are a fixed contract with
// the route folders: `routes/<module>/<module>.ts` exports `router_<module>`.
//
// The caller is the site (web/), served from the same origin — its server relays /api/* here — so
// there is no CORS: no other origin may call this API. Everything but /health and /auth needs a
// signed-in student, and every write needs the site's own header (routes/auth/common.ts).
import { Hono } from 'hono';
import { requireClientHeader, requireSession } from '@/routes/auth/common';
import { router_auth } from '@/routes/auth/auth';
import { router_chat } from '@/routes/chat/chat';
import { router_health } from '@/routes/health/health';
import { router_study } from '@/routes/study/study';
import { router_up } from '@/routes/up/up';
import { chromePath } from '@/services/common/svc-browser';
import { app_env, getEnvStatus } from '@/services/common/svc-env';

const env_status = getEnvStatus();
for (const warning of env_status.warnings) console.warn(`[env] ${warning}`);
if (!env_status.ok) {
    console.error(`[env] missing required variables: ${env_status.missing.join(', ')}`);
    process.exit(1);
}

const app = new Hono();

app.use('*', requireClientHeader);
app.use('/chat/*', requireSession);
app.use('/study/*', requireSession);

// ── Feature routers ─────────────────────────────────────────────────────────
app.route('/health', router_health);
app.route('/auth', router_auth);
app.route('/up', router_up);
app.route('/chat', router_chat);
app.route('/study', router_study);

// Every unhandled throw lands here. Respond through the shared envelope shape, never a bare body.
app.onError((error, c) => {
    console.error(error);
    return c.json({ data: null, statusCode: 500, message: 'Internal server error' }, 500);
});

console.log(
    `[api] listening on ${app_env.host}:${app_env.port} — chat model ${app_env.chat_model}, effort ${app_env.chat_effort}; study model ${app_env.study_model}, UD ${app_env.ud_standin === '' ? 'live' : `stand-in at ${app_env.ud_standin}`}, PDF printing ${chromePath() === null ? 'unavailable (no Chrome found)' : 'ready'}`,
);

// Bun drops a connection that has been silent for its idle timeout (10 s by default). A proxied UD
// call can take longer — Stellic's profile, or renewing a lapsed session through SSO — so the
// connection gets Bun's maximum and the request's own timeouts decide instead.
export default { port: app_env.port, hostname: app_env.host, idleTimeout: 255, fetch: app.fetch };
