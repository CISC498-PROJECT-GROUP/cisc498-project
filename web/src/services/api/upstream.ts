// The one way the site reaches a UD system — Canvas, Stellic, WebReg, the Media Gallery. Every
// client builds the real URL it would call from a browser on that system (https://udel.instructure.com/…)
// and hands it here; the request goes to our backend's /up/<host>/<path>, which makes it with the
// signed-in student's UD session (backend/src/services/upstream/). The site never holds a UD cookie.
//
// A 401 from the proxy means the student's UD session is gone: onSignedOut listeners hear about it
// (the app returns to the sign-in screen) and the request throws SignedOutError.

import { API_BASE, CLIENT_HEADER } from '@/services/config';

export class SignedOutError extends Error {
    constructor() {
        super('Your UD sign-in has expired — sign in again.');
    }
}

const listeners = new Set<() => void>();

/** Called whenever a request finds the student signed out. Returns an unsubscribe. */
export function onSignedOut(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export const announceSignedOut = (): void => {
    for (const listener of listeners) listener();
};

/** The proxy path for a real UD URL. */
export function proxyUrl(url: string | URL): string {
    const real = new URL(url);
    return `${API_BASE}/up/${real.hostname}${real.pathname}${real.search}`;
}

export interface UpstreamInit {
    method?: 'GET' | 'POST';
    headers?: Record<string, string>;
    body?: BodyInit;
}

/** The final URL an upstream request reached, after redirects (X-Upstream-Url), or the URL asked. */
export const upstreamUrl = (response: Response, asked: string | URL): string => response.headers.get('x-upstream-url') ?? new URL(asked).href;

/** fetch() a real UD URL through the proxy. Resolves with UD's own response (any status). */
export async function upstreamFetch(url: string | URL, init: UpstreamInit = {}): Promise<Response> {
    const method = init.method ?? 'GET';
    const headers: Record<string, string> = { ...init.headers };
    if (method !== 'GET') headers['X-Requested-With'] = CLIENT_HEADER;
    const response = await fetch(proxyUrl(url), { method, headers, body: init.body, credentials: 'same-origin' });
    if (response.status === 401 && response.headers.get('x-upstream-url') === null) {
        announceSignedOut();
        throw new SignedOutError();
    }
    if (response.status === 403 && response.headers.get('x-upstream-url') === null) {
        const message = ((await response.json().catch(() => null)) as { message?: string } | null)?.message;
        throw new Error(message ?? 'The site refused that request.');
    }
    if (response.status === 502 && response.headers.get('x-upstream-url') === null) {
        const message = ((await response.json().catch(() => null)) as { message?: string } | null)?.message;
        throw new Error(message ?? "A UD system didn't answer. Try again in a moment.");
    }
    return response;
}
