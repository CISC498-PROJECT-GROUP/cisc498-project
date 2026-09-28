// The shared response envelope. Routes respond ONLY through rsp() — never raw c.json — so every
// caller (the extension included) parses one shape:
// { data, statusCode, message }.

import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** Status codes the API speaks. 435 is the house code for a bad/absent parameter. */
export const stc = { OKAY: 200, INSUFFICIENT_PARAMS: 435, SERVER_FAULT: 500, NOT_CONFIGURED: 503 } as const;

export type Stc = (typeof stc)[keyof typeof stc];

/** Default message per status — so a route can omit `message` and still say something useful. */
export const err: Record<Stc, string> = { [stc.OKAY]: 'OK', [stc.INSUFFICIENT_PARAMS]: 'Missing or invalid parameters', [stc.SERVER_FAULT]: 'Internal server error', [stc.NOT_CONFIGURED]: 'Service is not configured' };

export interface Envelope<T> {
    data: T | null;
    statusCode: Stc;
    message: string;
}

/** The one way a route replies. `data` is null on every non-200. */
export function rsp<T>(c: Context, data?: T, status: Stc = stc.OKAY, message?: string): Response {
    const body: Envelope<T> = { data: status === stc.OKAY ? (data ?? null) : null, statusCode: status, message: message ?? err[status] };
    return c.json(body, status as ContentfulStatusCode);
}
