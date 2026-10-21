// The Hono side of every study route: read the JSON body, keep the connection open for a long model
// call, run the step, and answer through rsp() with one status per kind of failure.

import type { Context } from 'hono';
import { ModelNotConfiguredError, ModelUpstreamError } from '@/services/common/svc-model';
import { rsp, stc } from '@/services/common/svc-response';
import { StudyRenderUnavailableError, StudyRequestError } from '@/services/study/study-errors';

/** Bun closes a connection that has been silent for its idle timeout (10 s by default). A study step
    writes nothing until its model call returns, which takes far longer — so lift the timeout for
    this request. Under app.request() in tests there is no server, and nothing to lift. */
const keepOpen = (c: Context): void => {
    (c.env as { timeout?: (request: Request, seconds: number) => void } | undefined)?.timeout?.(c.req.raw, 0);
};

export async function runStep<I, O>(c: Context, validate: (body: unknown) => I, step: (input: I, signal: AbortSignal) => Promise<O>): Promise<Response> {
    keepOpen(c);
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return rsp(c, undefined, stc.INSUFFICIENT_PARAMS, 'Request body must be JSON.');
    }

    try {
        return rsp<O>(c, await step(validate(body), c.req.raw.signal));
    } catch (error) {
        if (error instanceof StudyRequestError) return rsp(c, undefined, stc.INSUFFICIENT_PARAMS, error.message);
        if (error instanceof ModelNotConfiguredError || error instanceof StudyRenderUnavailableError) return rsp(c, undefined, stc.NOT_CONFIGURED, error.message);
        if (error instanceof ModelUpstreamError) return rsp(c, undefined, error.configuration ? stc.NOT_CONFIGURED : stc.SERVER_FAULT, error.message);
        throw error;
    }
}
