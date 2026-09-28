// One chat message. Assistant answers are Markdown; the student's own words and errors are plain.

import { Markdown } from '@/components/chat/markdown';
import type { ChatMessage } from '@/services/types';

export function MessageBubble({ message }: { message: ChatMessage }) {
    if (message.role === 'user') return <div class="ca-bubble ca-bubble--user">{message.text}</div>;
    if (message.role === 'error')
        return (
            <div class="ca-bubble ca-bubble--error" role="alert">
                {message.text}
            </div>
        );
    return (
        <div class="ca-bubble ca-bubble--bot">
            <Markdown text={message.text} />
        </div>
    );
}
