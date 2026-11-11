// Kaltura's errors, and how a call chooses among a page's sessions. Each session Kaltura issues a page
// is limited to what that page needs, and which one allows which call isn't documented — so a call
// takes the sessions in turn and uses the first one Kaltura accepts. No network here; kaltura-api.ts
// makes the calls.

export class KalturaError extends Error {
    constructor(
        message: string,
        readonly code: string,
    ) {
        super(message);
    }
}

/** Runs `call` with each session in turn until one is accepted; the last refusal if none is. */
export async function withSessions<T>(sessions: string[], call: (ks: string) => Promise<T>): Promise<{ value: T; ks: string }> {
    let last: unknown = new KalturaError('The Media Gallery gave no session to read it with.', 'NO_SESSION');
    for (const ks of sessions) {
        try {
            return { value: await call(ks), ks };
        } catch (error) {
            last = error;
        }
    }
    throw last;
}
