// The background service worker. It makes the requests the content script cannot make well from
// inside Canvas's page:
//
//   - Calls to our backend. From the page they would be subject to Canvas's CORS context and to
//     Chrome's local-network-access prompt (an https page calling localhost); from here they are
//     plain extension requests to a host in host_permissions.
//   - File downloads. A Canvas file URL redirects to a storage host on another origin that does not
//     send CORS headers; host_permissions let this worker read the response anyway.

import type { ApiReply, ApiRequest, FileReply, FileRequest, WorkerRequest } from '@/services/api/messages';
import { API_BASE } from '@/services/config';

async function callApi(request: ApiRequest): Promise<ApiReply> {
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

const toBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary);
};

async function fetchFile(request: FileRequest): Promise<FileReply> {
    try {
        const response = await fetch(request.url, { credentials: 'include' });
        const contentType = (response.headers.get('content-type') ?? '').split(';')[0]!.trim();
        if (!response.ok) return { ok: false, status: response.status, contentType, base64: '', error: `download failed (${response.status})` };
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > request.maxBytes) return { ok: false, status: 413, contentType, base64: '', error: `file is ${Math.round(buffer.byteLength / 1e6)} MB — too large to read` };
        return { ok: true, status: response.status, contentType, base64: toBase64(buffer) };
    } catch (error) {
        return { ok: false, status: 0, contentType: '', base64: '', error: error instanceof Error ? error.message : String(error) };
    }
}

chrome.runtime.onMessage.addListener((message: WorkerRequest, _sender, sendResponse) => {
    if (message?.type === 'api') void callApi(message).then(sendResponse);
    else if (message?.type === 'file') void fetchFile(message).then(sendResponse);
    else return false;
    return true; // keep the channel open for the async reply
});
