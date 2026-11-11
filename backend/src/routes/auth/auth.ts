// /auth — signing a student in with their UD account, and out again.
//
//   POST /auth/login   { username, password } → starts the sign-in, sets the session cookie
//   GET  /auth/status  → where the sign-in stands (polled by the site's sign-in screen)
//   POST /auth/duo     { action, … } → the student's answer to a Duo step
//   POST /auth/logout  → ends the session; every UD cookie the server held goes with it
//
// Thin by contract: validate, delegate, answer through rsp().

import { Hono, type Context } from 'hono';
import type { LoginStatus } from '@canvas-assistant/shared';
import { clearSessionCookie, sessionOf, setSessionCookie } from '@/routes/auth/common';
import { answerDuo, AuthRequestError, beginLogin, signOut, validateDuo, validateLogin } from '@/services/auth/auth';
import { rsp, stc } from '@/services/common/svc-response';

export const router_auth = new Hono();

const SIGNED_OUT: LoginStatus = { step: 'failed', message: 'Not signed in.' };

async function body(c: Context): Promise<unknown> {
    try {
        return await c.req.json();
    } catch {
        return null;
    }
}

router_auth.post('/login', async (c) => {
    try {
        const request = validateLogin(await body(c));
        const previous = sessionOf(c);
        if (previous) await signOut(previous);
        const session = beginLogin(request);
        setSessionCookie(c, session);
        return rsp<LoginStatus>(c, session.status);
    } catch (error) {
        if (error instanceof AuthRequestError) return rsp(c, undefined, stc.INSUFFICIENT_PARAMS, error.message);
        throw error;
    }
});

router_auth.get('/status', (c) => rsp<LoginStatus>(c, sessionOf(c)?.status ?? SIGNED_OUT));

router_auth.post('/duo', async (c) => {
    const session = sessionOf(c);
    if (!session) return rsp(c, undefined, stc.UNAUTHORIZED);
    try {
        return rsp<LoginStatus>(c, answerDuo(session, validateDuo(await body(c))));
    } catch (error) {
        if (error instanceof AuthRequestError) return rsp(c, undefined, stc.INSUFFICIENT_PARAMS, error.message);
        throw error;
    }
});

router_auth.post('/logout', async (c) => {
    const session = sessionOf(c);
    if (session) await signOut(session);
    clearSessionCookie(c);
    return rsp<LoginStatus>(c, SIGNED_OUT);
});
