// The conversation: an empty state with starter questions, then the thread, a live status line
// while the assistant works, and the composer. Scrolls to the newest content as the thread grows.

import { useEffect, useRef } from 'preact/hooks';
import { Composer } from '@/components/chat/composer';
import { EmptyChat } from '@/components/chat/empty-chat';
import { Message } from '@/components/chat/message';
import { Icon } from '@/components/common/icon';
import type { ChatState } from '@/services/hooks/use-chat';

export function ChatView({ chat }: { chat: ChatState }) {
    const thread = useRef<HTMLDivElement>(null);

    useEffect(() => {
        thread.current?.scrollTo({ top: thread.current.scrollHeight, behavior: 'smooth' });
    }, [chat.messages.length, chat.pending, chat.activity]);

    return (
        <>
            <div ref={thread} class="ca-body ca-thread" aria-live="polite">
                {chat.messages.length === 0 ? <EmptyChat onPick={chat.send} /> : chat.messages.map((m) => <Message key={m.id} message={m} />)}
                {chat.pending && (
                    <div class="ca-msg ca-msg--bot">
                        <span class="ca-avatar ca-avatar--busy" aria-hidden="true">
                            <Icon name="sparkle" size={14} />
                        </span>
                        <span class="ca-status">
                            <span class="ca-status-text">{chat.activity ? `${chat.activity}…` : 'Thinking…'}</span>
                        </span>
                    </div>
                )}
            </div>
            <div class="ca-chat-foot">
                <Composer onSend={chat.send} disabled={chat.pending} placeholder={chat.messages.length === 0 ? 'Ask about your courses…' : 'Ask a follow-up…'} />
                <p class="ca-disclaimer">Answers use your Canvas data — double-check what matters.</p>
            </div>
        </>
    );
}
