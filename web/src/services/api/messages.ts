// The shapes of a raw UD request and its reply, as the Media Gallery and file clients use them.

/** A request to the course's Media Gallery (Kaltura) — its pages, carrying the session the gallery's
    launch set, and its API. */
export interface WebRequest {
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

export interface FileReply {
    ok: boolean;
    status: number;
    contentType: string;
    base64: string;
    error?: string;
}
