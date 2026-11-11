// The only way the site talks to our backend's own routes (chat, study PDFs, sign-in). Requests go to
// /api on the site's origin with the session cookie; writes carry the client header the backend
// requires. UD systems are reached through upstream.ts instead.
//
// Every call resolves to the envelope's `data` or throws a BackendError whose message is written
// for the student, because it ends up on screen. A 401 means the student is signed out.

import type { Envelope } from '@canvas-assistant/shared';
import { announceSignedOut } from '@/services/api/upstream';
import { API_BASE, CLIENT_HEADER } from '@/services/config';

export class BackendError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message);
    }
}

interface Reply {
    status: number;
    json: unknown;
    networkError?: string;
}

async function send(method: 'GET' | 'POST', path: string, body?: unknown): Promise<Reply> {
    try {
        const headers: Record<string, string> = method === 'GET' ? {} : { 'X-Requested-With': CLIENT_HEADER };
        if (body !== undefined) headers['content-type'] = 'application/json';
        const response = await fetch(`${API_BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), credentials: 'same-origin' });
        return { status: response.status, json: await response.json().catch(() => null) };
    } catch (error) {
        return { status: 0, json: null, networkError: error instanceof Error ? error.message : String(error) };
    }
}

const describe = (reply: Reply): string => {
    if (reply.networkError !== undefined) return "I can't reach the site's server. Is it running? (bun run dev:api)";
    const message = (reply.json as Envelope<unknown> | null)?.message;
    if (reply.status === 503) return `The assistant server isn't set up yet: ${message ?? 'no API key'}.`;
    if (reply.status === 401) return message ?? 'Sign in with your UD account first.';
    return message ? `Something went wrong: ${message}` : `Something went wrong (HTTP ${reply.status}).`;
};

/** Call a backend route; `quiet401` leaves a 401 to the caller instead of signing the app out. */
export async function callBackend<T>(method: 'GET' | 'POST', path: string, body?: unknown, quiet401 = false): Promise<T> {
    const reply = await send(method, path, body);
    const envelope = reply.json as Envelope<T> | null;
    if (reply.status === 401 && !quiet401) announceSignedOut();
    if (reply.status !== 200 || envelope?.data == null) throw new BackendError(describe(reply), reply.status);
    return envelope.data;
}
