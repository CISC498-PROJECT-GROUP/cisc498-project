// What the auth routes call: begin a sign-in, report status, sign out. The student answers UD's
// 2FA in UD's own window, so there is nothing to relay. The real sign-in (login-flow.ts) or, with UD_STANDIN set, the stand-in (standin-login.ts).

import type { LoginRequest } from '@canvas-assistant/shared';
import { startLogin } from '@/services/auth/login-flow';
import { createSession, endSession, type Session } from '@/services/auth/sessions';
import { startStandinLogin } from '@/services/auth/standin-login';
import { app_env } from '@/services/common/svc-env';

export class AuthRequestError extends Error {}

const USERNAME = /^[a-z0-9._-]{1,64}$/i;

export function validateLogin(body: unknown): LoginRequest {
    const { username, password } = (body ?? {}) as Partial<Record<keyof LoginRequest, unknown>>;
    if (typeof username !== 'string' || typeof password !== 'string') throw new AuthRequestError('Enter your UD username and password.');
    // People type their full address; CAS wants the username alone.
    const user = username.trim().replace(/@udel\.edu$/i, '');
    if (!USERNAME.test(user) || password.length === 0 || password.length > 256) throw new AuthRequestError('Enter your UD username and password.');
    return { username: user, password };
}

/** A new session, its sign-in already under way. */
export function beginLogin({ username, password }: LoginRequest): Session {
    const session = createSession(username);
    if (app_env.ud_standin !== '') startStandinLogin(session, username);
    else startLogin(session, username, password);
    return session;
}

export const signOut = (session: Session): Promise<void> => endSession(session.id);
