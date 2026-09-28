// Failures the chat service raises, each mapped to one status by the route.

/** No API key — the route answers 503 so the extension can say "not configured" rather than "broken". */
export class ChatNotConfiguredError extends Error {}

/** The request itself is malformed — 435. */
export class ChatRequestError extends Error {}

/** The upstream call failed. `configuration` marks 401/403 — a bad key — which is also a 503. */
export class ChatUpstreamError extends Error {
    constructor(
        message: string,
        readonly configuration = false,
    ) {
        super(message);
    }
}
