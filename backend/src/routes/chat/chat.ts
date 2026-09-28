// POST /chat/turn — one step of a conversation: the client-held message list in, the model's reply
// out. Thin by contract: validate, delegate, answer through rsp().

import { Hono } from 'hono';
import type { ChatTurnResponse } from '@canvas-assistant/shared';
import { ChatNotConfiguredError, ChatRequestError, ChatUpstreamError } from '@/services/chat/chat-errors';
import { chatTurn } from '@/services/chat/chat-turn';
import { validateChatTurn } from '@/services/chat/chat-validate';
import { rsp, stc } from '@/services/common/svc-response';

export const router_chat = new Hono();

router_chat.post('/turn', async (c) => {
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return rsp(c, undefined, stc.INSUFFICIENT_PARAMS, 'Request body must be JSON.');
    }

    try {
        return rsp<ChatTurnResponse>(c, await chatTurn(validateChatTurn(body), c.req.raw.signal));
    } catch (error) {
        if (error instanceof ChatRequestError) return rsp(c, undefined, stc.INSUFFICIENT_PARAMS, error.message);
        if (error instanceof ChatNotConfiguredError) return rsp(c, undefined, stc.NOT_CONFIGURED, error.message);
        if (error instanceof ChatUpstreamError) return rsp(c, undefined, error.configuration ? stc.NOT_CONFIGURED : stc.SERVER_FAULT, error.message);
        throw error;
    }
});
