// Assistant (#/assistant): the full-page chat. The conversation itself is held by App, so it is still
// here after a trip to another page; "New chat" starts over.

import { ChatView } from '@/components/chat/chat-view';
import { Icon } from '@/components/common/icon';
import type { ChatState } from '@/services/hooks/use-chat';

export function AssistantPage({ chat }: { chat: ChatState }) {
    return (
        <section class="ca-chat-page" aria-label="Assistant">
            <header class="ca-chat-head">
                <span class="ca-avatar" aria-hidden="true">
                    <Icon name="sparkle" size={15} />
                </span>
                <div class="ca-chat-head-text">
                    <h1 class="ca-chat-title">Assistant</h1>
                    <p class="ca-chat-sub">Answers from your courses, degree plan, registration and recorded lectures</p>
                </div>
                {chat.messages.length > 0 && (
                    <button type="button" class="ca-btn ca-btn--quiet" onClick={chat.reset} disabled={chat.pending}>
                        <Icon name="compose" size={15} />
                        New chat
                    </button>
                )}
            </header>
            <ChatView chat={chat} />
        </section>
    );
}
