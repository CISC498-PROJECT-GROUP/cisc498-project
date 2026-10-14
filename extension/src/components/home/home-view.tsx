// The home screen, "Your next move": a greeting, the one thing to act on now, what else is due in
// the next 48 hours, a one-tap ask to the assistant, then the shortcuts and a composer. Typing a
// question here goes straight to the chat — no need to open it first.

import { Composer } from '@/components/chat/composer';
import { Icon } from '@/components/common/icon';
import { LoadState } from '@/components/common/load-state';
import { DueTimeline } from '@/components/home/due-timeline';
import { NavTile } from '@/components/home/nav-tile';
import { PriorityCard } from '@/components/home/priority-card';
import { greeting } from '@/services/format/dates';
import { nextMove } from '@/services/format/group-deadlines';
import { useCourses } from '@/services/hooks/use-courses';
import { useDeadlines } from '@/services/hooks/use-deadlines';
import { useStudent } from '@/services/hooks/use-student';
import type { Deadline, View } from '@/services/types';

interface HomeViewProps {
    onNavigate: (view: View) => void;
    onAsk: (question: string) => void;
}

const CATCH_UP = 'Help me catch up: what is overdue, what does each course say about late work, and what should I do first?';
const PLAN_48H = 'Plan my next 48 hours: what is due, roughly how long each will take, and what order should I do them in?';

export function HomeView({ onNavigate, onAsk }: HomeViewProps) {
    const student = useStudent();
    const deadlines = useDeadlines();
    const courses = useCourses();
    const now = new Date();
    const first = student.data?.shortName.split(' ')[0];
    const move = nextMove(deadlines.data, now);
    const ready = !deadlines.loading && !deadlines.error;
    const late = move.overdue.length > 0;
    const busy = move.overdue.length > 1 || move.soon.length > 2;
    const courseOf = (d: Deadline) => courses.data.find((c) => c.id === d.courseId);
    const seeAll = () => onNavigate('deadlines');

    return (
        <div class="ca-home">
            <div class={`ca-home-main ${busy ? 'ca-home-main--busy' : ''}`}>
                <div class="ca-welcome">
                    <p class="ca-welcome-hello">
                        {greeting(now)}
                        {first ? `, ${first}` : ''}.
                    </p>
                    <h2 class="ca-welcome-title">Your next move</h2>
                </div>
                <LoadState state={deadlines} rows={3} />
                {ready && move.focus === null && (
                    <section class="ca-priority">
                        <p class="ca-priority-kicker">
                            <span class="ca-dot" aria-hidden="true" />
                            All caught up
                        </p>
                        <h3 class="ca-priority-title">Nothing due in the next two weeks.</h3>
                    </section>
                )}
                {ready && move.focus && <PriorityCard focus={move.focus} overdue={move.overdue} courseOf={courseOf} onSeeAll={seeAll} />}
                {ready && move.focus && <DueTimeline soon={move.soon} afterFocus={!late} courseOf={courseOf} onSeeAll={seeAll} />}
                {ready && (
                    <div class="ca-assist">
                        <button type="button" class="ca-cta ca-cta--sm" onClick={() => onAsk(late ? CATCH_UP : PLAN_48H)}>
                            <Icon name="sparkle" size={16} />
                            <span class="ca-cta-label">{late ? 'Help me catch up' : 'Plan my next 48 hours'}</span>
                            <Icon name="arrow" size={15} />
                        </button>
                        {late && !busy && (
                            <button type="button" class="ca-link ca-assist-alt" onClick={() => onAsk(PLAN_48H)}>
                                Plan my next 48 hours
                                <Icon name="arrow" size={12} />
                            </button>
                        )}
                    </div>
                )}
            </div>
            <nav class="ca-shortcuts" aria-label="Sections">
                <NavTile icon="sparkle" label="Ask" primary onSelect={() => onNavigate('chat')} />
                <NavTile icon="calendar" label="Deadlines" onSelect={seeAll} />
                <NavTile icon="grades" label="Grades" onSelect={() => onNavigate('grades')} />
                <NavTile icon="help" label="Help" onSelect={() => onNavigate('support')} />
            </nav>
            <div class="ca-composer-area">
                <Composer onSend={onAsk} placeholder="Ask anything about your courses…" autoFocus={false} />
            </div>
        </div>
    );
}
