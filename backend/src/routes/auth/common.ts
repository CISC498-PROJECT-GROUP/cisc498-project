// The Hono side of a student's session, shared by every router: the session cookie, the guard that
// lets only signed-in students reach the routes that use their UD session (or spend the model key),
// and the header check that keeps other sites from driving those routes.
//
// The cookie holds only an unguessable session id — HttpOnly, so the site's own script can't read
// it, and SameSite=Strict, so no other site's page can make the browser send it. On top of that,
// every non-GET must carry `X-Requested-With: canvas-assistant`, which a cross-site form can't set.

import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { findSession, IDLE_MS, isSignedIn, type Session } from '@/services/auth/sessions';
import { rsp, stc } from '@/services/common/svc-response';

const COOKIE = 'ca_session';
export const CLIENT_HEADER = 'canvas-assistant';

const secure = (c: Context): boolean => new URL(c.req.url).protocol === 'https:' || c.req.header('x-forwarded-proto') === 'https';

export const setSessionCookie = (c: Context, session: Session): void => setCookie(c, COOKIE, session.id, { httpOnly: true, sameSite: 'Strict', path: '/', secure: secure(c), maxAge: Math.round(IDLE_MS / 1000) * 8 });

export const clearSessionCookie = (c: Context): void => {
    deleteCookie(c, COOKIE, { path: '/' });
};

/** The caller's session, signed in or not; null when there is none. */
export const sessionOf = (c: Context): Session | null => findSession(getCookie(c, COOKIE));

type Env = { Variables: { session: Session } };

/** Signed-in students only. The session is on c.get('session') after this. */
export const requireSession: MiddlewareHandler<Env> = async (c, next) => {
    const session = sessionOf(c);
    if (!isSignedIn(session)) return rsp(c, undefined, stc.UNAUTHORIZED);
    c.set('session', session);
    await next();
};

/** Non-GET requests must come from the site's own script. */
export const requireClientHeader: MiddlewareHandler = async (c, next) => {
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD' && c.req.method !== 'OPTIONS' && c.req.header('x-requested-with') !== CLIENT_HEADER) return rsp(c, undefined, stc.FORBIDDEN, 'Requests must come from the site.');
    await next();
};

export const signedInSession = (c: Context): Session => c.get('session') as Session;
