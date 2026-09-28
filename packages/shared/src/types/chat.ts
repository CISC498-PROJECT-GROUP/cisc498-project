/* The POST /chat/turn contract. The EXTENSION owns the conversation and runs the tools (it is the
   side holding the student's Canvas session); the backend owns the model key, the system prompt and
   the tool definitions, and makes one model call per request. So a question that needs three tool
   calls is four round trips, and the backend stores nothing between them.

   Content blocks are passed through as the API shapes them — including thinking blocks, which the
   model requires back unchanged — so they are typed loosely here rather than re-declared. */

export interface ContentBlock {
    type: string;
    [key: string]: unknown;
}

export interface ChatMessageParam {
    role: 'user' | 'assistant';
    content: string | ContentBlock[];
}

export interface ChatTurnRequest {
    messages: ChatMessageParam[];
}

export interface ChatTurnResponse {
    content: ContentBlock[];
    /** end_turn | tool_use | max_tokens | refusal | … — the extension loops while it is tool_use. */
    stop_reason: string;
}
