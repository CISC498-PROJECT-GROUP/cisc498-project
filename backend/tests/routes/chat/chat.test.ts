// Route tests for POST /chat/turn. fetch is stubbed, so the SDK's request is intercepted before it
// leaves the process and nothing reaches the Anthropic API.
//
// What matters is that each kind of failure keeps its own status: the extension says "not set up"
// on a 503 and "something went wrong" on a 500, and a 435 means the extension built a bad request.

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { router_chat } from '@/routes/chat/chat';
import { app_env, DEFAULT_CHAT_EFFORT, DEFAULT_CHAT_MODEL } from '@/services/common/svc-env';

const real_fetch = globalThis.fetch;
const real_key = app_env.anthropic_api_key;
const app = new Hono().route('/chat', router_chat);

let sent: Record<string, unknown> | null = null;

const message = (content: unknown[], stop_reason = 'end_turn') => ({
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-5-5',
    content,
    stop_reason,
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
});

const reply = (body: unknown, status = 200) => {
    globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
        sent = JSON.parse(String(init?.body ?? 'null'));
        return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
};

const post = (payload: unknown) => app.request('/chat/turn', { method: 'POST', headers: { 'content-type': 'application/json' }, body: typeof payload === 'string' ? payload : JSON.stringify(payload) });

const QUESTION = { messages: [{ role: 'user', content: "What's due this week?" }] };

beforeEach(() => {
    sent = null;
    app_env.anthropic_api_key = 'sk-test';
    reply(message([{ type: 'text', text: 'Nothing is due.' }]));
});

afterEach(() => {
    globalThis.fetch = real_fetch;
    app_env.anthropic_api_key = real_key;
});

describe('POST /chat/turn', () => {
    it('returns the model content and stop reason', async () => {
        const res = await post(QUESTION);
        expect(res.status).toBe(200);
        expect(((await res.json()) as { data: unknown }).data).toEqual({ content: [{ type: 'text', text: 'Nothing is due.' }], stop_reason: 'end_turn' });
    });

    it('sends the Canvas tools, the frozen system prompt and the fallback opt-in', async () => {
        await post(QUESTION);
        expect((sent?.tools as { name: string }[]).map((t) => t.name)).toContain('get_upcoming_work');
        expect(sent?.fallbacks).toBe('default');
        expect(sent?.thinking).toEqual({ type: 'adaptive' });
    });

    it('defaults to Sonnet 5.5 at low effort, scoped to Canvas with no homework help', async () => {
        await post(QUESTION);
        expect(DEFAULT_CHAT_MODEL).toBe('claude-sonnet-5-5');
        expect(DEFAULT_CHAT_EFFORT).toBe('low');
        expect(sent?.model).toBe(app_env.chat_model);
        expect(sent?.output_config).toEqual({ effort: app_env.chat_effort });
        const system = (sent?.system as { text: string }[])[0]?.text ?? '';
        expect(system).toContain('Everything else is out of scope');
        expect(system).toContain('No homework help');
    });

    it('passes tool calls through so the extension can run them', async () => {
        reply(message([{ type: 'tool_use', id: 'toolu_1', name: 'list_courses', input: {} }], 'tool_use'));
        const body = (await (await post(QUESTION)).json()) as { data: { stop_reason: string } };
        expect(body.data.stop_reason).toBe('tool_use');
    });

    it('turns a refusal into a plain answer instead of an error', async () => {
        reply(message([], 'refusal'));
        const body = (await (await post(QUESTION)).json()) as { data: { stop_reason: string; content: { text: string }[] } };
        expect(body.data.stop_reason).toBe('end_turn');
        expect(body.data.content[0]?.text).toContain("can't help");
    });

    it('answers 435 for a malformed conversation', async () => {
        expect((await post('not json')).status).toBe(435);
        expect((await post({ messages: [] })).status).toBe(435);
        expect((await post({ messages: [{ role: 'assistant', content: 'hi' }] })).status).toBe(435);
        expect(
            (
                await post({
                    messages: [
                        { role: 'user', content: 'q' },
                        { role: 'assistant', content: 'a' },
                    ],
                })
            ).status,
        ).toBe(435);
    });

    it('answers 503 without a key, and for a rejected key', async () => {
        app_env.anthropic_api_key = '';
        expect((await post(QUESTION)).status).toBe(503);
        app_env.anthropic_api_key = 'sk-test';
        reply({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }, 401);
        expect((await post(QUESTION)).status).toBe(503);
    });

    it('answers 500 for a bad request upstream', async () => {
        reply({ type: 'error', error: { type: 'invalid_request_error', message: 'bad block' } }, 400);
        expect((await post(QUESTION)).status).toBe(500);
    });
});
