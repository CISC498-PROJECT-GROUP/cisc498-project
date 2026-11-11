// What the auth routes call: begin a sign-in, relay the student's Duo answer, report status, sign
// out. The real sign-in (login-flow.ts) or, with UD_STANDIN set, the stand-in (standin-login.ts).

import type { DuoAction, LoginRequest, LoginStatus } from '@canvas-assistant/shared';
import { startLogin } from '@/services/auth/login-flow';
import { createSession, endSession, type Session } from '@/services/auth/sessions';
import { startStandinLogin } from '@/services/auth/standin-login';
import { app_env } from '@/services/common/svc-env';

export class AuthRequestError extends Error {}

const USERNAME = /^[a-z0-9._-]{1,64}$/i;
const PASSCODE = /^\d{6,9}$/;

export function validateLogin(body: unknown): LoginRequest {
    const { username, password } = (body ?? {}) as Partial<Record<keyof LoginRequest, unknown>>;
    if (typeof username !== 'string' || typeof password !== 'string') throw new AuthRequestError('Enter your UD username and password.');
    // People type their full address; CAS wants the username alone.
    const user = username.trim().replace(/@udel\.edu$/i, '');
    if (!USERNAME.test(user) || password.length === 0 || password.length > 256) throw new AuthRequestError('Enter your UD username and password.');
    return { username: user, password };
}

export function validateDuo(body: unknown): DuoAction {
    const raw = (body ?? {}) as { action?: unknown; method?: unknown; code?: unknown };
    if (raw.action === 'retry') return { action: 'retry' };
    if (raw.action === 'method' && (raw.method === 'push' || raw.method === 'call' || raw.method === 'passcode')) return { action: 'method', method: raw.method };
    if (raw.action === 'passcode' && typeof raw.code === 'string' && PASSCODE.test(raw.code.trim())) return { action: 'passcode', code: raw.code.trim() };
    throw new AuthRequestError('A Duo passcode is 6 to 9 digits.');
}

/** A new session, its sign-in already under way. */
export function beginLogin({ username, password }: LoginRequest): Session {
    const session = createSession(username);
    if (app_env.ud_standin !== '') startStandinLogin(session, username);
    else startLogin(session, username, password);
    return session;
}

/** Pass the student's Duo answer to the sign-in waiting on it. */
export function answerDuo(session: Session, action: DuoAction): LoginStatus {
    if (!session.answer) throw new AuthRequestError('The sign-in is not waiting on Duo.');
    session.answer(action);
    return session.status;
}

export const signOut = (session: Session): Promise<void> => endSession(session.id);
