// The WebReg client. WebReg has no public API: these are the calls its own page makes
// (registration/js/schedule.js), sent through the backend's UD proxy on the student's WebReg session.
// The proxy adds WebReg's CSRF token (X-CSRF-TOKEN, read off its pages) to every POST — see
// docs/webreg-integration.html.
//
// Every JSON answer is an envelope {result, messages, errors, object}; anything but SUCCESS throws
// WebregError with WebReg's own errors, so a caller never mistakes a refusal for data.

import { upstreamFetch, upstreamUrl } from '@/services/api/upstream';
import { WEBREG_ORIGIN } from '@/services/school';
import type { Envelope } from '@/services/webreg/webreg-types';

export class WebregError extends Error {
    constructor(
        message: string,
        readonly errors: string[] = [],
    ) {
        super(message);
    }
}

/** The real WebReg URL for a path under /registration/. */
export const webregUrl = (path: string): string => `${WEBREG_ORIGIN}/registration/${path.replace(/^\//, '')}`;

/** A message or error as text — WebReg sends strings, sometimes {message} objects. */
export function textOf(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        const v = value as { message?: unknown; text?: unknown; descr?: unknown };
        const text = v.message ?? v.text ?? v.descr;
        if (typeof text === 'string') return text;
    }
    return '';
}

export const textsOf = (values: unknown[] | undefined): string[] => (values ?? []).map(textOf).filter(Boolean);

function statusError(status: number): WebregError {
    if (status === 401 || status === 403) return new WebregError('WebReg needs you to sign in again — sign out and back in to renew it.');
    if (status === 404) return new WebregError("WebReg doesn't have that page.");
    return new WebregError(`WebReg answered ${status}. Try again in a moment.`);
}

/** The envelope's object, or a WebregError with WebReg's own reasons. */
export function unwrap<T>(envelope: Envelope<T> | null): T {
    if (!envelope || typeof envelope !== 'object') throw new WebregError("WebReg's answer wasn't readable.");
    if (envelope.result !== 'SUCCESS') {
        const errors = textsOf(envelope.errors);
        throw new WebregError(errors[0] ?? `WebReg could not do that (${envelope.result ?? 'no result'}).`, errors);
    }
    return envelope.object as T;
}

async function readEnvelope<T>(response: Response): Promise<T> {
    if (!response.ok) throw statusError(response.status);
    const envelope = (await response.json().catch(() => null)) as Envelope<T> | null;
    return unwrap(envelope);
}

export async function webregGet<T>(path: string): Promise<T> {
    return readEnvelope<T>(await upstreamFetch(webregUrl(path), { headers: { accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }));
}

export async function webregPost<T>(path: string, body: unknown): Promise<T> {
    const headers = { accept: 'application/json', 'content-type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
    return readEnvelope<T>(await upstreamFetch(webregUrl(path), { method: 'POST', headers, body: JSON.stringify(body) }));
}

/** An HTML page, with the URL it ended on after redirects. */
export async function webregPage(path: string): Promise<{ html: string; url: string }> {
    const asked = webregUrl(path);
    const response = await upstreamFetch(asked, { headers: { accept: 'text/html' } });
    if (!response.ok) throw statusError(response.status);
    return { html: await response.text(), url: upstreamUrl(response, asked) };
}
