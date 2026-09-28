// The chat: what the thread shows, whether a reply is pending, what the assistant is doing right
// now, and send().
//
// Two lists are kept. `messages` is what the student sees. `history` is the conversation sent to the
// model — tool calls, tool results and thinking blocks included. A failed turn leaves `history`
// exactly as it was, so the next question starts from a valid conversation.

import type { ChatMessageParam, ContentBlock } from '@canvas-assistant/shared';
import { useCallback, useRef, useState } from 'preact/hooks';
import { contextBlock, questionBlock } from '@/services/chat/context';
import { runTurn, type ToolCall } from '@/services/chat/run-turn';
import { TOOL_ACTIVITY } from '@/services/tools';
import type { ChatMessage } from '@/services/types';

export interface ChatState {
    messages: ChatMessage[];
    pending: boolean;
    /** e.g. "Reading the syllabus" while a tool runs; null otherwise. */
    activity: string | null;
    send: (text: string) => void;
    /** Start a fresh conversation. Ignored while a reply is pending. */
    reset: () => void;
}

let next_id = 0;
const message = (role: ChatMessage['role'], text: string): ChatMessage => ({ id: `m${++next_id}`, role, text });

const describe = (calls: ToolCall[]): string => {
    const labels = [...new Set(calls.map((c) => TOOL_ACTIVITY[c.name as keyof typeof TOOL_ACTIVITY] ?? 'Looking that up'))];
    return labels.join(' · ');
};

export function useChat(): ChatState {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [pending, setPending] = useState(false);
    const [activity, setActivity] = useState<string | null>(null);
    const history = useRef<ChatMessageParam[]>([]);
    const busy = useRef(false);

    const send = useCallback((text: string) => {
        const question = text.trim();
        if (question === '' || busy.current) return;
        busy.current = true;
        setMessages((current) => [...current, message('user', question)]);
        setPending(true);
        setActivity(null);

        void (async () => {
            try {
                const content: ContentBlock[] = history.current.length === 0 ? [await contextBlock(), questionBlock(question)] : [questionBlock(question)];
                const turn = await runTurn([...history.current, { role: 'user', content }], (calls) => setActivity(describe(calls)));
                history.current = turn.messages;
                setMessages((current) => [...current, message('assistant', turn.answer)]);
            } catch (error) {
                setMessages((current) => [...current, message('error', error instanceof Error ? error.message : String(error))]);
            } finally {
                busy.current = false;
                setPending(false);
                setActivity(null);
            }
        })();
    }, []);

    const reset = useCallback(() => {
        if (busy.current) return;
        history.current = [];
        setMessages([]);
    }, []);

    return { messages, pending, activity, send, reset };
}
