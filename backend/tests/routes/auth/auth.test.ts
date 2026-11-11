// Route tests for /auth, run against the stand-in sign-in (UD_STANDIN) so no browser starts and
// nothing reaches UD. What matters: the session cookie is HttpOnly + SameSite=Strict, a write
// without the site's header is refused, the sign-in waits on UD's own 2FA step, and signing out ends
// the session.

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import type { LoginStatus } from '@canvas-assistant/shared';
import { requireClientHeader } from '@/routes/auth/common';
import { router_auth } from '@/routes/auth/auth';
import { app_env } from '@/services/common/svc-env';

const real_standin = app_env.ud_standin;
beforeAll(() => {
    app_env.ud_standin = 'http://standin.test/__standin';
});
afterAll(() => {
    app_env.ud_standin = real_standin;
});

const app = new Hono().use('*', requireClientHeader).route('/auth', router_auth);
const SITE = { 'x-requested-with': 'canvas-assistant', 'content-type': 'application/json' };

const status = async (res: Response) => (await res.json()) as { data: LoginStatus | null; message: string };
const cookieOf = (res: Response) => (res.headers.get('set-cookie') ?? '').split(';')[0]!;

async function signIn(): Promise<string> {
    const res = await app.request('/auth/login', { method: 'POST', headers: SITE, body: JSON.stringify({ username: 'student@udel.edu', password: 'pw' }) });
    return cookieOf(res);
}

describe('/auth', () => {
    it('refuses a write that did not come from the site', async () => {
        const res = await app.request('/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'a', password: 'b' }) });
        expect(res.status).toBe(403);
    });

    it('asks for both fields', async () => {
        const res = await app.request('/auth/login', { method: 'POST', headers: SITE, body: JSON.stringify({ username: 'student' }) });
        expect(res.status).toBe(435);
    });

    it('starts a sign-in with an HttpOnly, SameSite=Strict session cookie', async () => {
        const res = await app.request('/auth/login', { method: 'POST', headers: SITE, body: JSON.stringify({ username: 'student', password: 'pw' }) });
        expect(res.status).toBe(200);
        expect((await status(res)).data?.step).toBe('working');
        const cookie = res.headers.get('set-cookie') ?? '';
        expect(cookie).toContain('ca_session=');
        expect(cookie).toContain('HttpOnly');
        expect(cookie).toContain('SameSite=Strict');
    });

    it('waits on UD’s own 2FA window, then signs in — the site never handles a code', async () => {
        const cookie = await signIn();
        await Bun.sleep(900); // the stand-in "sends the code" after a beat
        expect((await status(await app.request('/auth/status', { headers: { cookie } }))).data?.step).toBe('verify');
        expect((await app.request('/auth/duo', { method: 'POST', headers: { ...SITE, cookie }, body: JSON.stringify({ code: '123456' }) })).status).toBe(404);
        await Bun.sleep(2700);
        const done = (await status(await app.request('/auth/status', { headers: { cookie } }))).data;
        expect(done?.step).toBe('signed-in');
        expect(done?.username).toBe('student');
        expect(done?.services).toEqual({ canvas: true, stellic: true, webreg: true });
    });

    it('ends the session on sign-out', async () => {
        const cookie = await signIn();
        await app.request('/auth/logout', { method: 'POST', headers: { ...SITE, cookie } });
        const after = (await status(await app.request('/auth/status', { headers: { cookie } }))).data;
        expect(after?.step).toBe('failed');
    });

    it('reports a stranger as signed out', async () => {
        expect((await status(await app.request('/auth/status'))).data?.step).toBe('failed');
    });
});
