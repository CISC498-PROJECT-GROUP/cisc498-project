// Route tests for /up/<host>/<path>. fetch is stubbed, so nothing reaches UD. What matters: no
// session, no proxy; a relayed response comes back as itself (status, type, final URL); a refused
// request answers in the envelope.

import { afterEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { router_up } from '@/routes/up/up';
import { createSession, endSession } from '@/services/auth/sessions';

const app = new Hono().route('/up', router_up);
const realFetch = globalThis.fetch;
afterEach(() => {
    globalThis.fetch = realFetch;
});

function signedIn(): { cookie: string; end: () => Promise<void> } {
    const session = createSession('student');
    session.status = { step: 'signed-in', message: 'Signed in.' };
    return { cookie: `ca_session=${session.id}`, end: () => endSession(session.id) };
}

describe('/up', () => {
    it('needs a signed-in student', async () => {
        const res = await app.request('/up/udel.instructure.com/api/v1/courses');
        expect(res.status).toBe(401);
    });

    it('relays UD’s answer as itself', async () => {
        const { cookie, end } = signedIn();
        let asked = '';
        globalThis.fetch = (async (input: string | URL | Request) => {
            asked = String(input);
            return new Response('while(1);[{"id":1}]', { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
        }) as typeof fetch;
        const res = await app.request('/up/udel.instructure.com/api/v1/courses?per_page=100', { headers: { cookie } });
        expect(asked).toBe('https://udel.instructure.com/api/v1/courses?per_page=100');
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('application/json');
        expect(res.headers.get('x-upstream-url')).toBe('https://udel.instructure.com/api/v1/courses?per_page=100');
        expect(await res.text()).toBe('while(1);[{"id":1}]');
        await end();
    });

    it('answers a refused request in the envelope', async () => {
        const { cookie, end } = signedIn();
        const res = await app.request('/up/example.com/anything', { headers: { cookie } });
        expect(res.status).toBe(403);
        expect(res.headers.get('x-upstream-url')).toBeNull();
        expect(((await res.json()) as { message: string }).message).toContain("won't");
        await end();
    });
});
