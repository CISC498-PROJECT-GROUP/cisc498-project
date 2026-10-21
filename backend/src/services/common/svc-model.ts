// Failures every feature that calls the model can raise, and the one mapping from the SDK's typed
// errors onto them. Each route maps these to the same statuses, so the extension tells "not set up"
// (503) from "something broke" (500) the same way whichever feature failed.

import { Anthropic } from '@/services/common/svc-anthropic';
import { ANTHROPIC_KEY_HINT } from '@/services/common/svc-env';

/** No API key — the route answers 503 so the extension can say "not configured" rather than "broken". */
export class ModelNotConfiguredError extends Error {}

/** The upstream call failed. `configuration` marks 401/403 — a bad key — which is also a 503. */
export class ModelUpstreamError extends Error {
    constructor(
        message: string,
        readonly configuration = false,
    ) {
        super(message);
    }
}

/** Typed SDK errors, most specific first. The upstream wording is kept — it is the useful part. */
export function upstreamError(error: unknown): Error {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) return new ModelUpstreamError(`The API key was rejected (${error.status}). ${ANTHROPIC_KEY_HINT}.`, true);
    if (error instanceof Anthropic.RateLimitError) return new ModelUpstreamError('The model is rate-limited right now — try again in a moment.');
    if (error instanceof Anthropic.BadRequestError) return new ModelUpstreamError(`The model rejected the request: ${error.message}`);
    if (error instanceof Anthropic.APIError) return new ModelUpstreamError(`The model API failed (${error.status ?? 'network'}): ${error.message}`);
    return error instanceof Error ? error : new Error(String(error));
}
