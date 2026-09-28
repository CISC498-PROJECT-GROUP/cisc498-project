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

export type WorkerRequest = ApiRequest | FileRequest;
