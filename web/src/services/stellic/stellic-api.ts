// The Stellic client. Stellic has no public API: these are the endpoints its own web app calls, made
// through the backend's UD proxy on the student's Stellic session, so the site sees exactly what the
// student sees in Stellic. Reads only. Some reads are POSTs (Stellic's choice); the proxy adds the
// CSRF token and the Origin/Referer Django checks for them — see docs/stellic-integration.html.
//
// Every response starts with `)]}',` — Stellic's guard against JSON hijacking — stripped before
// parsing. A lapsed Stellic session is renewed by the proxy through single sign-on.

import { upstreamFetch } from '@/services/api/upstream';
import { STELLIC_ORIGIN } from '@/services/school';

export class StellicError extends Error {
    constructor(
        message: string,
        readonly signedOut = false,
    ) {
        super(message);
    }
}

export const SIGNED_OUT = 'Stellic needs you to sign in again.';

/** Stellic JSON, with the `)]}',` guard stripped. */
export const parseStellicJson = (text: string): unknown => JSON.parse(text.replace(/^\)\]\}',?\s*/, ''));

type Body = { form: Record<string, string> } | { json: unknown };

async function request<T>(path: string, body?: Body): Promise<T> {
    const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' };
    if (body) headers['content-type'] = 'form' in body ? 'application/x-www-form-urlencoded' : 'application/json';
    const payload = body === undefined ? undefined : 'form' in body ? new URLSearchParams(body.form) : JSON.stringify(body.json);
    const response = await upstreamFetch(`${STELLIC_ORIGIN}${path}`, { method: body ? 'POST' : 'GET', headers, body: payload });
    if (response.status === 401) throw new StellicError(SIGNED_OUT, true);
    if (response.status === 403) throw new StellicError('Stellic refused the request (403). Your Stellic session may have expired — sign in to Stellic again.', true);
    if (!response.ok) throw new StellicError(`Stellic answered ${response.status} for ${path}.`);
    const json = parseStellicJson(await response.text()) as T & { success?: boolean };
    if (json && json.success === false) throw new StellicError(`Stellic could not load ${path}.`);
    return json;
}

export const stellicGet = <T>(path: string): Promise<T> => request<T>(path);
export const stellicPostForm = <T>(path: string, form: Record<string, string>): Promise<T> => request<T>(path, { form });
export const stellicPostJson = <T>(path: string, json: unknown): Promise<T> => request<T>(path, { json });
