// One model call for one step of a chat. The extension runs the tool loop: it sends the
// conversation, gets back either an answer (end_turn) or tool calls (tool_use), runs the tools
// against Canvas, and sends the results in the next request.
//
// Model: claude-sonnet-5-5 with adaptive thinking at CHAT_EFFORT. `fallbacks: "default"` re-runs a
// request that the model's safety classifiers decline on Anthropic's recommended fallback model,
// so a false positive on an ordinary course question becomes an answer rather than a dead end.
//
// Caching: tools + the frozen system prompt form a stable prefix, and top-level cache_control
// caches the growing conversation too — each tool round re-sends everything before it.

import type { ChatTurnRequest, ChatTurnResponse, ContentBlock } from '@canvas-assistant/shared';
import { CANVAS_TOOLS } from '@canvas-assistant/shared';
import { ChatNotConfiguredError, ChatUpstreamError } from '@/services/chat/chat-errors';
import { CHAT_SYSTEM } from '@/services/chat/chat-prompt';
import { Anthropic, anthropic } from '@/services/common/svc-anthropic';
import { ANTHROPIC_KEY_HINT, app_env, chatConfigured } from '@/services/common/svc-env';
import { createLogger } from '@/services/common/svc-log';

const log = createLogger('chat');

/** Non-streaming, so this stays under the SDK's HTTP timeout; answers are a few hundred tokens. */
const MAX_TOKENS = 16000;

const REFUSAL_TEXT = "I can't help with that one. Try rephrasing, or ask me something else about your courses.";

export async function chatTurn(request: ChatTurnRequest, signal?: AbortSignal): Promise<ChatTurnResponse> {
    if (!chatConfigured()) throw new ChatNotConfiguredError(`${ANTHROPIC_KEY_HINT}.`);
    const started = performance.now();

    let response: Anthropic.Beta.BetaMessage;
    try {
        response = await anthropic().beta.messages.create(
            {
                model: app_env.chat_model,
                max_tokens: MAX_TOKENS,
                betas: ['server-side-fallback-2026-07-01'],
                fallbacks: 'default',
                thinking: { type: 'adaptive' },
                output_config: { effort: app_env.chat_effort },
                cache_control: { type: 'ephemeral' },
                system: [{ type: 'text', text: CHAT_SYSTEM, cache_control: { type: 'ephemeral' } }],
                tools: CANVAS_TOOLS as unknown as Anthropic.Beta.BetaTool[],
                messages: request.messages as unknown as Anthropic.Beta.BetaMessageParam[],
            },
            { signal },
        );
    } catch (error) {
        throw upstream(error);
    }

    const { usage } = response;
    log.info('turn complete', {
        stop_reason: response.stop_reason ?? 'none',
        model: response.model,
        ms: Math.round(performance.now() - started),
        messages: request.messages.length,
        input_tokens: usage.input_tokens,
        cache_read: usage.cache_read_input_tokens ?? 0,
        cache_write: usage.cache_creation_input_tokens ?? 0,
        output_tokens: usage.output_tokens,
    });

    /* The whole fallback chain declined. Answer in words rather than failing the request, and drop
       the declined content so it is never replayed into the conversation. */
    if (response.stop_reason === 'refusal') return { content: [{ type: 'text', text: REFUSAL_TEXT }], stop_reason: 'end_turn' };

    return { content: response.content as unknown as ContentBlock[], stop_reason: response.stop_reason ?? 'end_turn' };
}

/** Typed SDK errors, most specific first. The upstream wording is kept — it is the useful part. */
function upstream(error: unknown): Error {
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) return new ChatUpstreamError(`The API key was rejected (${error.status}). ${ANTHROPIC_KEY_HINT}.`, true);
    if (error instanceof Anthropic.RateLimitError) return new ChatUpstreamError('The model is rate-limited right now — try again in a moment.');
    if (error instanceof Anthropic.BadRequestError) return new ChatUpstreamError(`The model rejected the request: ${error.message}`);
    if (error instanceof Anthropic.APIError) return new ChatUpstreamError(`The model API failed (${error.status ?? 'network'}): ${error.message}`);
    return error instanceof Error ? error : new Error(String(error));
}
