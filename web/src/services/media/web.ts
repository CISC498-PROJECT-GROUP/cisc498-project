// The one way the site reaches a course's Media Gallery (Kaltura): through the backend's UD proxy,
// which carries the session the gallery's launch set (and the student's Canvas session before it).

import type { WebReply, WebRequest } from '@/services/api/messages';
import { SignedOutError, upstreamFetch, upstreamUrl } from '@/services/api/upstream';

export async function webRequest(request: WebRequest): Promise<WebReply> {
    try {
        const body = request.form ? new URLSearchParams(request.form) : request.json !== undefined ? JSON.stringify(request.json) : undefined;
        const headers: Record<string, string> = request.json !== undefined ? { 'content-type': 'application/json' } : request.form ? { 'content-type': 'application/x-www-form-urlencoded' } : {};
        const response = await upstreamFetch(request.url, { method: request.method, body, headers });
        return { ok: response.ok, status: response.status, url: upstreamUrl(response, request.url), text: await response.text() };
    } catch (error) {
        if (error instanceof SignedOutError) throw error;
        return { ok: false, status: 0, url: request.url, text: '', error: error instanceof Error ? error.message : String(error) };
    }
}
