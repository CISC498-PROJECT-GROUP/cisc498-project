// Route test for GET /health. The extension reads `configured` to tell "no key" from "down".

import { describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { router_health } from '@/routes/health/health';
import { app_env } from '@/services/common/svc-env';

const app = new Hono().route('/health', router_health);

describe('GET /health', () => {
    it('reports liveness, whether a key is set, and the model — never the key', async () => {
        const res = await app.request('/health');
        expect(res.status).toBe(200);
        const body = (await res.json()) as { data: Record<string, unknown> };
        expect(body.data).toEqual({ ok: true, configured: app_env.anthropic_api_key !== '', model: app_env.chat_model });
        expect(JSON.stringify(body)).not.toContain('sk-');
    });
});
