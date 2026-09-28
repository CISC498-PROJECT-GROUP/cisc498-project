// GET /health — the liveness probe. Mounted with no auth so anything can reach it; it therefore
// reports booleans and names, never a key or a host. `configured` lets the extension tell a
// running-but-keyless backend apart from one that is down.

import { Hono } from 'hono';
import type { HealthStatus } from '@canvas-assistant/shared';
import { app_env, chatConfigured } from '@/services/common/svc-env';
import { rsp } from '@/services/common/svc-response';

export const router_health = new Hono();

router_health.get('/', (c) => rsp<HealthStatus>(c, { ok: true, configured: chatConfigured(), model: app_env.chat_model }));
