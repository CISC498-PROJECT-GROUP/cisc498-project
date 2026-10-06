// The Canvas REST client. The content script runs ON the Canvas origin, so a same-origin request to
// /api/v1 carries the student's own session cookie: no token, no OAuth, and it can only ever see
// what the student can see. Reads only — GET is the only verb here; the one write the widget makes
// (submitting an assignment) lives in canvas-write.ts.
//
// `Accept: application/json` matters: without it Canvas prefixes JSON with `while(1);` (an old
// JSON-hijacking guard). The prefix is stripped anyway in case an install ignores the header.

export class CanvasError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message);
    }
}

type Params = Record<string, string | number | boolean | readonly string[] | undefined>;

const query = (params: Params = {}): string => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined) continue;
        if (Array.isArray(value)) for (const item of value) search.append(key, item);
        else search.append(key, String(value));
    }
    const text = search.toString();
    return text === '' ? '' : `?${text}`;
};

export const explain = (status: number, path: string): string => {
    if (status === 401) return 'Canvas says you are not logged in — refresh the page and sign in again.';
    if (status === 403) return `Canvas doesn't let students see this (${path}).`;
    if (status === 404) return `Canvas has nothing at ${path}.`;
    return `Canvas answered ${status} for ${path}.`;
};

/** Canvas JSON, with the `while(1);` guard stripped. */
export const parseCanvasJson = (text: string): unknown => JSON.parse(text.replace(/^while\(1\);/, ''));

async function request(url: string): Promise<{ body: unknown; next: string | null }> {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
    if (!response.ok) throw new CanvasError(explain(response.status, new URL(url, location.origin).pathname), response.status);
    const text = await response.text();
    const next = /<([^>]+)>;\s*rel="next"/.exec(response.headers.get('link') ?? '')?.[1] ?? null;
    return { body: parseCanvasJson(text), next };
}

/** One object (or one page). */
export async function canvasGet<T>(path: string, params?: Params): Promise<T> {
    return (await request(`/api/v1${path}${query(params)}`)).body as T;
}

/** Every page of a list, following Link: rel="next", up to `maxPages` pages. */
export async function canvasGetAll<T>(path: string, params?: Params, maxPages = 10): Promise<T[]> {
    const out: T[] = [];
    let url: string | null = `/api/v1${path}${query({ per_page: 100, ...params })}`;
    for (let page = 0; url !== null && page < maxPages; page++) {
        const { body, next } = await request(url);
        out.push(...(body as T[]));
        url = next;
    }
    return out;
}

/** Canvas returns html_url values as absolute or site-relative; make them absolute. */
export const absoluteUrl = (url: string | null | undefined): string | null => (url ? new URL(url, location.origin).toString() : null);
