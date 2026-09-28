// The Anthropic client. One instance, created on first use.
//
// `fetch` is wrapped rather than passed through so that it resolves globalThis.fetch at CALL time:
// tests replace globalThis.fetch per case, and a client that captured the real one at construction
// would reach the network instead.

import Anthropic from '@anthropic-ai/sdk';
import { app_env } from '@/services/common/svc-env';

let client: Anthropic | null = null;

export function anthropic(): Anthropic {
    client ??= new Anthropic({ apiKey: app_env.anthropic_api_key, fetch: (input, init) => globalThis.fetch(input, init), maxRetries: 2 });
    return client;
}

export { Anthropic };
