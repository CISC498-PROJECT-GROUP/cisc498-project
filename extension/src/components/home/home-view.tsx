// The home menu: the four destinations, and a pseudo-input that opens the chat.

import { Icon } from '@/components/common/icon';
import { MenuItem } from '@/components/home/menu-item';
import type { View } from '@/services/types';

export function HomeView({ onNavigate }: { onNavigate: (view: View) => void }) {
    return (
        <div class="ca-body ca-home">
            <MenuItem icon="chat" label="Chat with Assistant" description="Ask about any course, assignment, or policy" onSelect={() => onNavigate('chat')} />
            <MenuItem icon="grades" label="View Grade Breakdown" description="Current grades across all your courses" onSelect={() => onNavigate('grades')} />
            <MenuItem icon="calendar" label="Upcoming Deadlines" description="What's due in every course, next two weeks" onSelect={() => onNavigate('deadlines')} />
            <MenuItem icon="help" label="Canvas Support" description="Help links and your instructors" onSelect={() => onNavigate('support')} />
            <div class="ca-spacer" />
            <button type="button" class="ca-ask" onClick={() => onNavigate('chat')}>
                <span class="ca-ask-text">Ask anything about your courses…</span>
                <span class="ca-ask-go">
                    <Icon name="arrow" size={16} />
                </span>
            </button>
            <p class="ca-footnote">Answers come from the courses you're enrolled in.</p>
        </div>
    );
}
