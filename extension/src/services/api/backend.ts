// The only way the extension talks to our backend. Inside Chrome the request is relayed through the
// background worker (see background.ts for why); in the preview harness there is no worker, so it
// goes direct — the backend's CORS allows that origin.
//
// Every call resolves to the envelope's `data` or throws a BackendError whose message is written
// for the student, because it ends up on screen.

import type { Envelope } from '@canvas-assistant/shared';
import type { ApiReply, ApiRequest } from '@/services/api/messages';
import { API_BASE, inExtension } from '@/services/config';

export class BackendError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message);
    }
}

async function send(request: ApiRequest): Promise<ApiReply> {
    if (inExtension()) return (await chrome.runtime.sendMessage(request)) as ApiReply;
    try {
        const response = await fetch(`${API_BASE}${request.path}`, {
            method: request.method,
            headers: request.body === undefined ? undefined : { 'content-type': 'application/json' },
            body: request.body === undefined ? undefined : JSON.stringify(request.body),
        });
        return { status: response.status, json: await response.json().catch(() => null) };
    } catch (error) {
        return { status: 0, json: null, networkError: error instanceof Error ? error.message : String(error) };
    }
}

const describe = (reply: ApiReply): string => {
    if (reply.networkError !== undefined) return `I can't reach the assistant server at ${API_BASE}. Is it running? (bun run dev:api)`;
    const message = (reply.json as Envelope<unknown> | null)?.message;
    if (reply.status === 503) return `The assistant server isn't set up yet: ${message ?? 'no API key'}.`;
    return message ? `Something went wrong: ${message}` : `Something went wrong (HTTP ${reply.status}).`;
};

export async function callBackend<T>(method: ApiRequest['method'], path: string, body?: unknown): Promise<T> {
    const reply = await send({ type: 'api', method, path, body });
    const envelope = reply.json as Envelope<T> | null;
    if (reply.status !== 200 || envelope?.data == null) throw new BackendError(describe(reply), reply.status);
    return envelope.data;
}
