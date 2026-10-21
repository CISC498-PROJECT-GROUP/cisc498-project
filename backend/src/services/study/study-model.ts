// One structured model call for the study pipeline: a frozen system prompt, the request's content,
// and a JSON schema the reply must match. Structured outputs (output_config.format) make the reply
// parse; what it SAYS is checked by each step afterwards.
//
// Model: STUDY_MODEL (Claude Opus 5.5 by default) with adaptive thinking; each step picks its effort.
// `fallbacks: "default"` re-runs a request a safety classifier declined on the recommended fallback
// model, so a false positive on a lecture about, say, network security still gets written.
//
// Non-streaming: every step is sized to finish well inside MAX_TOKENS, which keeps the request under
// the SDK's non-streaming ceiling (about 21k) and lets tests stub one JSON response.

import { Anthropic, anthropic } from '@/services/common/svc-anthropic';
import { ANTHROPIC_KEY_HINT, app_env, chatConfigured, type Effort } from '@/services/common/svc-env';
import { createLogger } from '@/services/common/svc-log';
import { ModelNotConfiguredError, ModelUpstreamError, upstreamError } from '@/services/common/svc-model';

const log = createLogger('study');

const MAX_TOKENS = 20000;

export type StudyContent = Anthropic.Beta.BetaContentBlockParam[];

export interface StructuredCall {
    /** Names the step in the log line — never content. */
    step: string;
    system: string;
    content: StudyContent;
    schema: Record<string, unknown>;
    effort: Effort;
    signal?: AbortSignal;
}

/** A content block the API may cache: put the parts several calls share first. */
export const cached = (text: string): Anthropic.Beta.BetaTextBlockParam => ({ type: 'text', text, cache_control: { type: 'ephemeral' } });

export const plain = (text: string): Anthropic.Beta.BetaTextBlockParam => ({ type: 'text', text });

export function requireModel(): void {
    if (!chatConfigured()) throw new ModelNotConfiguredError(`${ANTHROPIC_KEY_HINT}.`);
}

export async function structuredCall<T>(call: StructuredCall): Promise<T> {
    requireModel();
    const started = performance.now();

    let response: Anthropic.Beta.BetaMessage;
    try {
        response = await anthropic().beta.messages.create(
            {
                model: app_env.study_model,
                max_tokens: MAX_TOKENS,
                betas: ['server-side-fallback-2026-07-01'],
                fallbacks: 'default',
                thinking: { type: 'adaptive' },
                output_config: { effort: call.effort, format: { type: 'json_schema', schema: call.schema } },
                system: [{ type: 'text', text: call.system, cache_control: { type: 'ephemeral' } }],
                messages: [{ role: 'user', content: call.content }],
            },
            { signal: call.signal },
        );
    } catch (error) {
        throw upstreamError(error);
    }

    const { usage } = response;
    log.info(`${call.step} complete`, {
        stop_reason: response.stop_reason ?? 'none',
        model: response.model,
        ms: Math.round(performance.now() - started),
        input_tokens: usage.input_tokens,
        cache_read: usage.cache_read_input_tokens ?? 0,
        cache_write: usage.cache_creation_input_tokens ?? 0,
        output_tokens: usage.output_tokens,
    });

    if (response.stop_reason === 'refusal') throw new ModelUpstreamError(`The model declined to write the ${call.step}.`);
    if (response.stop_reason === 'max_tokens') throw new ModelUpstreamError(`The ${call.step} ran past the model's output limit.`);

    const text = response.content
        .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');
    try {
        return JSON.parse(text) as T;
    } catch {
        throw new ModelUpstreamError(`The model's ${call.step} was not valid JSON.`);
    }
}
