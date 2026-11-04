// The Stellic client. Stellic has no public API: these are the endpoints its own web app calls, and
// they run on the student's Stellic session cookie — the same session their browser already holds —
// so the dashboard sees exactly what the student sees in Stellic. Reads only. Some reads are POSTs
// (Stellic's choice), which is why they need the CSRF token and the Origin rule in stellic-rule.ts.
//
// Every response starts with `)]}',` — Stellic's guard against JSON hijacking — stripped before
// parsing. A signed-out request is redirected to UD's single sign-on; `redirect: 'manual'` turns
// that into an opaque redirect we can recognise instead of following it into a login page.

import { STELLIC_ORIGIN } from '@/services/school';

export class StellicError extends Error {
    constructor(
        message: string,
        readonly signedOut = false,
    ) {
        super(message);
    }
}

export const SIGNED_OUT = 'Stellic needs you to sign in. Open Stellic in a tab, sign in, then try again.';

/** Stellic JSON, with the `)]}',` guard stripped. */
export const parseStellicJson = (text: string): unknown => JSON.parse(text.replace(/^\)\]\}',?\s*/, ''));

async function csrfToken(): Promise<string> {
    const cookie = await chrome.cookies.get({ url: STELLIC_ORIGIN, name: 'csrftoken' });
    if (!cookie?.value) throw new StellicError(SIGNED_OUT, true);
    return cookie.value;
}

type Body = { form: Record<string, string> } | { json: unknown };

async function request<T>(path: string, body?: Body): Promise<T> {
    const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' };
    if (body) headers['X-CSRFToken'] = await csrfToken();
    const payload = body === undefined ? undefined : 'form' in body ? new URLSearchParams(body.form) : JSON.stringify(body.json);
    const response = await fetch(`${STELLIC_ORIGIN}${path}`, { method: body ? 'POST' : 'GET', headers, body: payload, credentials: 'include', redirect: 'manual' });
    if (response.type === 'opaqueredirect' || response.status === 401) throw new StellicError(SIGNED_OUT, true);
    if (response.status === 403) throw new StellicError('Stellic refused the request (403). Your Stellic session may have expired — sign in to Stellic again.', true);
    if (!response.ok) throw new StellicError(`Stellic answered ${response.status} for ${path}.`);
    const json = parseStellicJson(await response.text()) as T & { success?: boolean };
    if (json && json.success === false) throw new StellicError(`Stellic could not load ${path}.`);
    return json;
}

export const stellicGet = <T>(path: string): Promise<T> => request<T>(path);
export const stellicPostForm = <T>(path: string, form: Record<string, string>): Promise<T> => request<T>(path, { form });
export const stellicPostJson = <T>(path: string, json: unknown): Promise<T> => request<T>(path, { json });
