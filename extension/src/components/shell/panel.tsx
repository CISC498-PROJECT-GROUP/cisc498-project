// The floating panel: picks the header and body for the current view. The body is keyed by view so
// each switch replays the entrance animation.

import { ChatView } from '@/components/chat/chat-view';
import { Icon } from '@/components/common/icon';
import { DeadlinesView } from '@/components/deadlines/deadlines-view';
import { GradesView } from '@/components/grades/grades-view';
import { HomeHero } from '@/components/home/home-hero';
import { HomeView } from '@/components/home/home-view';
import { PanelHeader } from '@/components/shell/panel-header';
import { SupportView } from '@/components/support/support-view';
import type { ChatState } from '@/services/hooks/use-chat';
import type { View } from '@/services/types';

const TITLES: Record<Exclude<View, 'home'>, string> = { chat: 'Assistant', grades: 'Grades', deadlines: 'Deadlines', support: 'Help & instructors' };

interface PanelProps {
    view: View;
    expanded: boolean;
    onExpand: () => void;
    onNavigate: (view: View) => void;
    onClose: () => void;
    chat: ChatState;
    onAsk: (question: string) => void;
}

export function Panel({ view, expanded, onExpand, onNavigate, onClose, chat, onAsk }: PanelProps) {
    const newChat =
        view === 'chat' && chat.messages.length > 0 ? (
            <button type="button" class="ca-icon-btn ca-icon-btn--muted" onClick={chat.reset} disabled={chat.pending} aria-label="New chat" title="New chat">
                <Icon name="compose" size={17} />
            </button>
        ) : null;

    return (
        <section class={`ca-panel ${expanded ? 'ca-panel--expanded' : ''}`} role="dialog" aria-label="Canvas Assistant">
            {view === 'home' ? <HomeHero onNavigate={onNavigate} onClose={onClose} /> : <PanelHeader title={TITLES[view]} expanded={expanded} onBack={() => onNavigate('home')} onExpand={onExpand} onClose={onClose} actions={newChat} />}
            <div key={view} class="ca-view">
                {view === 'home' && <HomeView onNavigate={onNavigate} onAsk={onAsk} />}
                {view === 'chat' && <ChatView chat={chat} />}
                {view === 'grades' && <GradesView onAsk={onAsk} />}
                {view === 'deadlines' && <DeadlinesView onAsk={onAsk} />}
                {view === 'support' && <SupportView onAsk={onAsk} />}
            </div>
        </section>
    );
}
