// The Canvas writes. There is exactly one thing the site changes in Canvas — the student's own
// assignment submission — and only after the student confirms it in the submit view. The assistant
// never reaches this module: no chat tool writes.
//
// Writes go through the backend's UD proxy like the reads, so they carry the student's session.
// Canvas also requires its CSRF token on any cookie-authenticated write (the X-CSRF-Token header,
// from its `_csrf_token` cookie); the proxy adds it, since only the server holds the cookie.
//
// File uploads follow Canvas's three-step flow: ask Canvas for an upload slot, POST the bytes to
// the slot's upload_url (often a storage host on another origin), then refer to the file's id.

import { upstreamFetch } from '@/services/api/upstream';
import { absoluteUrl, CanvasError, explain, parseCanvasJson } from '@/services/canvas/canvas-api';

/** Canvas's own reason when it gives one ("You are not allowed to submit…"), else the generic one. */
async function failure(response: Response, path: string): Promise<CanvasError> {
    let reason: string | undefined;
    try {
        const body = parseCanvasJson(await response.text()) as { message?: string; errors?: { message?: string }[] | Record<string, unknown> };
        reason = body.message ?? (Array.isArray(body.errors) ? body.errors[0]?.message : undefined);
    } catch {
        /* not JSON — fall back to the status */
    }
    return new CanvasError(reason ? `Canvas said: ${reason}` : explain(response.status, path), response.status);
}

/** POST a form to /api/v1 as the student. */
export async function canvasPost<T>(path: string, form: URLSearchParams): Promise<T> {
    const response = await upstreamFetch(absoluteUrl(`/api/v1${path}`)!, { method: 'POST', headers: { Accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' }, body: form });
    if (!response.ok) throw await failure(response, path);
    return parseCanvasJson(await response.text()) as T;
}

interface UploadSlot {
    upload_url: string;
    upload_params: Record<string, string>;
}

interface UploadedFile {
    id?: number | string;
    /** Some storage backends answer with a link to Canvas's confirmation instead of the file. */
    location?: string;
}

/** Upload one file into `slotPath` (the endpoint that hands out upload slots) and return its id. */
export async function uploadFile(slotPath: string, file: File): Promise<string> {
    const slot = await canvasPost<UploadSlot>(slotPath, new URLSearchParams({ name: file.name, size: String(file.size), content_type: file.type || 'application/octet-stream' }));

    const form = new FormData();
    for (const [key, value] of Object.entries(slot.upload_params)) form.append(key, value);
    form.append('file', file); // must come last
    const response = await upstreamFetch(slot.upload_url, { method: 'POST', body: form });
    if (!response.ok) throw new CanvasError(`Uploading ${file.name} failed (${response.status}).`, response.status);

    let uploaded = parseCanvasJson(await response.text()) as UploadedFile;
    if (uploaded.id == null && uploaded.location) {
        const confirm = await upstreamFetch(uploaded.location, { headers: { Accept: 'application/json' } });
        if (!confirm.ok) throw await failure(confirm, 'the file upload');
        uploaded = parseCanvasJson(await confirm.text()) as UploadedFile;
    }
    if (uploaded.id == null) throw new CanvasError(`Canvas didn't confirm the upload of ${file.name}.`, 0);
    return String(uploaded.id);
}
