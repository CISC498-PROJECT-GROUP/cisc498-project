// The tool loop. Send the conversation to the backend; if the model asks for tools, run them all in
// parallel against Canvas, send every result back in ONE user message, and repeat until it answers.
//
// The conversation is append-only: each assistant reply goes back exactly as it came (thinking
// blocks included — the model requires them unchanged), and nothing earlier is ever edited.

import type { ChatMessageParam, ChatTurnResponse, ContentBlock } from '@canvas-assistant/shared';
import { callBackend } from '@/services/api/backend';
import { runTool } from '@/services/tools';
import type { Attachment } from '@/services/types';

/** Enough for a hunt through syllabus page → modules → files → the PDF, or for working out an
    exam's lecture range (syllabus, announcements, files, the lecture list) before a study PDF. */
const MAX_STEPS = 16;

export interface ToolCall {
    name: string;
    input: Record<string, unknown>;
}

export interface TurnResult {
    messages: ChatMessageParam[];
    answer: string;
    /** Files the tools made this turn, shown under the answer. */
    attachments: Attachment[];
}

const textOf = (content: ContentBlock[]): string =>
    content
        .filter((b) => b.type === 'text' && typeof b.text === 'string')
        .map((b) => b.text as string)
        .join('\n\n')
        .trim();

export async function runTurn(history: ChatMessageParam[], onTools: (calls: ToolCall[]) => void, onProgress: (label: string) => void = () => undefined): Promise<TurnResult> {
    const messages = [...history];
    const attachments: Attachment[] = [];
    for (let step = 0; step < MAX_STEPS; step++) {
        const reply = await callBackend<ChatTurnResponse>('POST', '/chat/turn', { messages });
        messages.push({ role: 'assistant', content: reply.content });

        const uses = reply.content.filter((b) => b.type === 'tool_use');
        if (reply.stop_reason !== 'tool_use' || uses.length === 0) {
            const answer = textOf(reply.content) || "I couldn't put an answer together — try asking another way.";
            return { messages, answer: reply.stop_reason === 'max_tokens' ? `${answer}\n\n(That answer was cut off.)` : answer, attachments };
        }

        onTools(uses.map((u) => ({ name: String(u.name), input: (u.input ?? {}) as Record<string, unknown> })));
        const results = await Promise.all(
            uses.map(async (use) => {
                const run = await runTool(String(use.name), use.input, { progress: onProgress });
                if (run.attachment) attachments.push(run.attachment);
                return { type: 'tool_result', tool_use_id: use.id, content: run.content, ...(run.isError ? { is_error: true } : {}) } as ContentBlock;
            }),
        );
        messages.push({ role: 'user', content: results });
    }
    throw new Error('That question took too many steps to look up — try asking something narrower.');
}
