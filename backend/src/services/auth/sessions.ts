// The signed-in students, in memory only. There is no database and nothing here is ever written
// out: a restart signs everyone out, which is the intended failure mode for a store that holds live
// UD sessions. A session is found by an unguessable id the site keeps in an HttpOnly cookie.
//
// Each session owns the student's cookie jar and, while it lives, the isolated browser context the
// sign-in ran in — kept so an expired Canvas, Stellic or WebReg session can be renewed through CAS
// single sign-on without asking for the password again. Idle sessions are closed after IDLE_MS.

import type { BrowserContext } from 'puppeteer-core';
import type { DuoAction, LoginStatus, UdService } from '@canvas-assistant/shared';
import { createJar, type Jar } from '@/services/auth/cookie-jar';

export const IDLE_MS = 60 * 60 * 1000;

export interface Session {
    readonly id: string;
    username: string;
    jar: Jar;
    context: BrowserContext | null;
    status: LoginStatus;
    /** Resolves the student's answer to the Duo step the sign-in is waiting on. */
    answer: ((reply: DuoAction) => void) | null;
    /** WebReg's CSRF token, read off the last WebReg page the proxy relayed. */
    webregCsrf: string | null;
    /** In-flight SSO renewals, one per service, so concurrent requests share one. */
    renewing: Partial<Record<UdService, Promise<void>>>;
    lastUsed: number;
}

const sessions = new Map<string, Session>();

const newId = (): string => {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Buffer.from(bytes).toString('base64url');
};

export function createSession(username: string): Session {
    const session: Session = { id: newId(), username, jar: createJar(), context: null, status: { step: 'working', message: 'Contacting UD…' }, answer: null, webregCsrf: null, renewing: {}, lastUsed: Date.now() };
    sessions.set(session.id, session);
    return session;
}

/** The live session for an id, marked as used; null when there is none or it has gone idle. */
export function findSession(id: string | undefined): Session | null {
    if (!id) return null;
    const session = sessions.get(id);
    if (!session) return null;
    if (Date.now() - session.lastUsed > IDLE_MS) {
        void endSession(id);
        return null;
    }
    session.lastUsed = Date.now();
    return session;
}

export const isSignedIn = (session: Session | null): session is Session => session !== null && session.status.step === 'signed-in';

/** Close a session: its browser context goes, and with it every UD cookie the server held. */
export async function endSession(id: string): Promise<void> {
    const session = sessions.get(id);
    if (!session) return;
    sessions.delete(id);
    session.jar.clear();
    session.answer = null;
    await session.context?.close().catch(() => undefined);
    session.context = null;
}

export const sessionCount = (): number => sessions.size;

const sweep = setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions) if (now - session.lastUsed > IDLE_MS) void endSession(id);
}, 60_000);
sweep.unref?.();
