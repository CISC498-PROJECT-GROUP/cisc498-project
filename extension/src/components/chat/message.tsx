// One message in the thread. The student's own words sit in an accent bubble on the right; the
// assistant's answers are plain, readable text beside a small avatar — no box around them, so a
// long answer reads like a page rather than a speech bubble. Errors get a quiet warning card.

import { Markdown } from '@/components/chat/markdown';
import { Icon } from '@/components/common/icon';
import type { ChatMessage } from '@/services/types';

export function Message({ message }: { message: ChatMessage }) {
    if (message.role === 'user')
        return (
            <div class="ca-msg ca-msg--user">
                <div class="ca-bubble">{message.text}</div>
            </div>
        );
    if (message.role === 'error')
        return (
            <div class="ca-msg ca-msg--error" role="alert">
                <Icon name="alert" size={16} />
                <span>{message.text}</span>
            </div>
        );
    return (
        <div class="ca-msg ca-msg--bot">
            <span class="ca-avatar" aria-hidden="true">
                <Icon name="sparkle" size={14} />
            </span>
            <div class="ca-answer">
                <Markdown text={message.text} />
            </div>
        </div>
    );
}
