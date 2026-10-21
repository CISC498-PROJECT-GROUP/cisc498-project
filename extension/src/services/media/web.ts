// The one way the extension reaches a course's Media Gallery (Kaltura). Inside Chrome the request is
// relayed through the background worker — Kaltura is another origin, and the gallery's session lives
// in its cookies — exactly as backend calls are. In the preview harness there is no worker and the
// stand-in gallery is same-origin, so the request goes direct.

import type { WebReply, WebRequest } from '@/services/api/messages';
import { inExtension } from '@/services/config';

export async function webRequest(request: Omit<WebRequest, 'type'>): Promise<WebReply> {
    if (inExtension()) return (await chrome.runtime.sendMessage({ type: 'web', ...request })) as WebReply;
    try {
        const body = request.form ? new URLSearchParams(request.form) : request.json !== undefined ? JSON.stringify(request.json) : undefined;
        const headers = request.json !== undefined ? { 'content-type': 'application/json' } : undefined;
        const response = await fetch(new URL(request.url, location.href), { method: request.method, body, headers, credentials: 'same-origin', redirect: 'follow' });
        return { ok: response.ok, status: response.status, url: response.url, text: await response.text() };
    } catch (error) {
        return { ok: false, status: 0, url: request.url, text: '', error: error instanceof Error ? error.message : String(error) };
    }
}
