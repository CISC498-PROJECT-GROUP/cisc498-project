// The messages the content script sends the background worker, and what comes back. Both sides
// import these, so a renamed field is a compile error rather than a silent undefined.

export interface ApiRequest {
    type: 'api';
    method: 'GET' | 'POST';
    path: string;
    body?: unknown;
}

export interface ApiReply {
    status: number;
    /** Parsed JSON body, or null when the backend was unreachable or answered with something else. */
    json: unknown;
    /** Set when the fetch itself failed — the backend is down or the address is wrong. */
    networkError?: string;
}

export interface FileRequest {
    type: 'file';
    url: string;
    maxBytes: number;
}

export interface FileReply {
    ok: boolean;
    status: number;
    contentType: string;
    base64: string;
    error?: string;
}

/** A request to the course's Media Gallery (Kaltura) — its pages, carrying the session the gallery's
    launch set, and its API. The worker only sends these to Kaltura hosts. */
export interface WebRequest {
    type: 'web';
    url: string;
    method: 'GET' | 'POST';
    /** Sent as application/x-www-form-urlencoded — an LTI launch. */
    form?: Record<string, string>;
    /** Sent as JSON — a Kaltura API call. */
    json?: unknown;
}

export interface WebReply {
    ok: boolean;
    status: number;
    /** Where the request ended up after redirects. */
    url: string;
    text: string;
    error?: string;
}

export type WorkerRequest = ApiRequest | FileRequest | WebRequest;
