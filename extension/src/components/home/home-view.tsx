// The home screen body: four shortcuts, what's up next, and a composer. Typing a question here goes straight to the
// chat — no need to open it first.

import { Composer } from '@/components/chat/composer';
import { NavTile } from '@/components/home/nav-tile';
import { UpNext } from '@/components/home/up-next';
import type { View } from '@/services/types';

interface HomeViewProps {
    onNavigate: (view: View) => void;
    onAsk: (question: string) => void;
}

export function HomeView({ onNavigate, onAsk }: HomeViewProps) {
    return (
        <div class="ca-home">
            <div class="ca-tiles">
                <NavTile icon="chat" label="Ask" hint="Syllabi, policies…" onSelect={() => onNavigate('chat')} />
                <NavTile icon="calendar" label="Deadlines" hint="Next two weeks" onSelect={() => onNavigate('deadlines')} />
                <NavTile icon="grades" label="Grades" hint="By category" onSelect={() => onNavigate('grades')} />
                <NavTile icon="help" label="Help" hint="Instructors, Canvas" onSelect={() => onNavigate('support')} />
            </div>
            <UpNext onSeeAll={() => onNavigate('deadlines')} />
            <div class="ca-home-ask">
                <Composer onSend={onAsk} placeholder="Ask anything about your courses…" autoFocus={false} />
            </div>
        </div>
    );
}
