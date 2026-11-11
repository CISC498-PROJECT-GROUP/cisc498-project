// Which page the route shows. Keyed by route in the shell, so each switch replays the entrance
// animation and every page starts from fresh local state.

import { AssistantPage } from '@/components/chat/assistant-page';
import { DeadlinesPage } from '@/components/deadlines/deadlines-page';
import { DegreePage } from '@/components/degree/degree-page';
import { CoursesPage } from '@/components/grades/courses-page';
import { HomePage } from '@/components/home/home-page';
import { SchedulePage } from '@/components/schedule/schedule-page';
import { HelpPage } from '@/components/support/help-page';
import type { ChatState } from '@/services/hooks/use-chat';
import type { RouteId } from '@/services/routes';

interface PageProps {
    route: RouteId;
    chat: ChatState;
    onAsk: (question: string) => void;
}

export function Page({ route, chat, onAsk }: PageProps) {
    return (
        <div class={`ca-page ca-page--${route}`}>
            {route === 'home' && <HomePage onAsk={onAsk} />}
            {route === 'schedule' && <SchedulePage />}
            {route === 'courses' && <CoursesPage onAsk={onAsk} />}
            {route === 'deadlines' && <DeadlinesPage onAsk={onAsk} />}
            {route === 'assistant' && <AssistantPage chat={chat} />}
            {route === 'degree' && <DegreePage />}
            {route === 'help' && <HelpPage onAsk={onAsk} />}
        </div>
    );
}
