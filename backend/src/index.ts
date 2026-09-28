// API entry point. Reports env status at boot, mounts one Hono router per feature area, and
// defines the top-level onError. The router import names/paths below are a fixed contract with
// the route folders: `routes/<module>/<module>.ts` exports `router_<module>`.
//
// CORS is permissive on purpose: the caller is the browser extension, whose origin is
// chrome-extension://<id> and differs per install, and this API serves only local development.
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { router_chat } from '@/routes/chat/chat';
import { router_health } from '@/routes/health/health';
import { app_env, getEnvStatus } from '@/services/common/svc-env';

const env_status = getEnvStatus();
for (const warning of env_status.warnings) console.warn(`[env] ${warning}`);
if (!env_status.ok) {
    console.error(`[env] missing required variables: ${env_status.missing.join(', ')}`);
    process.exit(1);
}

const app = new Hono();

app.use('*', cors({ origin: (origin) => origin ?? '*', allowMethods: ['GET', 'POST', 'OPTIONS'], allowHeaders: ['content-type'], maxAge: 86400 }));

// ── Feature routers ─────────────────────────────────────────────────────────
app.route('/health', router_health);
app.route('/chat', router_chat);

// Every unhandled throw lands here. Respond through the shared envelope shape, never a bare body.
app.onError((error, c) => {
    console.error(error);
    return c.json({ data: null, statusCode: 500, message: 'Internal server error' }, 500);
});

console.log(`[api] listening on ${app_env.host}:${app_env.port} — chat model ${app_env.chat_model}, effort ${app_env.chat_effort}`);

export default { port: app_env.port, hostname: app_env.host, fetch: app.fetch };
