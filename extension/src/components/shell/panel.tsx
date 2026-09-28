// The floating panel: picks the header and body for the current view.

import { ChatView } from '@/components/chat/chat-view';
import { DeadlinesView } from '@/components/deadlines/deadlines-view';
import { GradesView } from '@/components/grades/grades-view';
import { HomeHeader } from '@/components/home/home-header';
import { HomeView } from '@/components/home/home-view';
import { PanelHeader } from '@/components/shell/panel-header';
import { SupportView } from '@/components/support/support-view';
import type { ChatState } from '@/services/hooks/use-chat';
import type { View } from '@/services/types';

const TITLES: Record<Exclude<View, 'home'>, string> = { chat: 'Chat with Assistant', grades: 'Grade Breakdown', deadlines: 'Upcoming Deadlines', support: 'Canvas Support' };

interface PanelProps {
    view: View;
    onNavigate: (view: View) => void;
    onClose: () => void;
    chat: ChatState;
    onAsk: (question: string) => void;
}

export function Panel({ view, onNavigate, onClose, chat, onAsk }: PanelProps) {
    return (
        <section class="ca-panel" role="dialog" aria-label="Canvas Assistant">
            {view === 'home' ? <HomeHeader onClose={onClose} /> : <PanelHeader title={TITLES[view]} onBack={() => onNavigate('home')} onClose={onClose} />}
            {view === 'home' && <HomeView onNavigate={onNavigate} />}
            {view === 'chat' && <ChatView chat={chat} />}
            {view === 'grades' && <GradesView onAsk={onAsk} />}
            {view === 'deadlines' && <DeadlinesView />}
            {view === 'support' && <SupportView onAsk={onAsk} />}
        </section>
    );
}
