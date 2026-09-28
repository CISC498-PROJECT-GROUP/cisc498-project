// Shape checks on a POST /chat/turn body. The conversation is client-held, so the backend checks it
// is a well-formed conversation — roles, block arrays, a user turn last — without re-validating the
// API's own block schemas; the Messages API rejects a bad block with a 400 of its own.

import type { ChatMessageParam, ChatTurnRequest } from '@canvas-assistant/shared';
import { ChatRequestError } from '@/services/chat/chat-errors';

/** A long conversation with many tool rounds stays well under this; more is a runaway loop. */
export const MAX_MESSAGES = 200;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const validMessage = (value: unknown): value is ChatMessageParam => {
    if (!isObject(value) || (value.role !== 'user' && value.role !== 'assistant')) return false;
    if (typeof value.content === 'string') return value.content.trim() !== '';
    return Array.isArray(value.content) && value.content.length > 0 && value.content.every((block) => isObject(block) && typeof block.type === 'string');
};

export function validateChatTurn(body: unknown): ChatTurnRequest {
    if (!isObject(body) || !Array.isArray(body.messages)) throw new ChatRequestError('Body must be JSON with a "messages" array.');
    const messages = body.messages;
    if (messages.length === 0) throw new ChatRequestError('"messages" is empty.');
    if (messages.length > MAX_MESSAGES) throw new ChatRequestError(`A conversation may hold at most ${MAX_MESSAGES} messages — start a new chat.`);
    const bad = messages.findIndex((m) => !validMessage(m));
    if (bad !== -1) throw new ChatRequestError(`messages[${bad}] must have role "user" or "assistant" and non-empty content.`);
    if ((messages[0] as ChatMessageParam).role !== 'user') throw new ChatRequestError('The conversation must start with a user message.');
    if ((messages[messages.length - 1] as ChatMessageParam).role !== 'user') throw new ChatRequestError('The last message must be from the user (a question or tool results).');
    return { messages: messages as ChatMessageParam[] };
}
