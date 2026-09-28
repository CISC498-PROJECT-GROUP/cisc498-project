// The conversation: the message thread, suggested questions while it is still empty, and the
// composer. Scrolls to the newest message whenever the thread grows.

import { useEffect, useRef } from 'preact/hooks';
import { Composer } from '@/components/chat/composer';
import { MessageBubble } from '@/components/chat/message-bubble';
import { Suggestions } from '@/components/chat/suggestions';
import type { ChatState } from '@/services/hooks/use-chat';

export function ChatView({ chat }: { chat: ChatState }) {
    const thread = useRef<HTMLDivElement>(null);
    const fresh = chat.messages.length === 1;

    useEffect(() => {
        thread.current?.scrollTo({ top: thread.current.scrollHeight });
    }, [chat.messages.length, chat.pending, chat.activity]);

    return (
        <>
            <div ref={thread} class="ca-body ca-thread" aria-live="polite">
                {chat.messages.map((m) => (
                    <MessageBubble key={m.id} message={m} />
                ))}
                {chat.pending && (
                    <div class="ca-pending">
                        <div class="ca-bubble ca-bubble--bot ca-typing" aria-label="Assistant is working">
                            <span />
                            <span />
                            <span />
                        </div>
                        {chat.activity && <span class="ca-activity">{chat.activity}…</span>}
                    </div>
                )}
                {fresh && <Suggestions onPick={chat.send} />}
            </div>
            <Composer onSend={chat.send} disabled={chat.pending} />
        </>
    );
}
