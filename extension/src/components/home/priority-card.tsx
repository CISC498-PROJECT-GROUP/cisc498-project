// "Your next move": the one item to act on now. Overdue work gets the warm alert card, with a way
// into the rest of it; with nothing overdue the card shows what is due next, in green.

import { Icon } from '@/components/common/icon';
import { relativeDue } from '@/services/format/dates';
import type { Course, Deadline } from '@/services/types';

interface PriorityCardProps {
    focus: Deadline;
    overdue: Deadline[];
    courseOf: (deadline: Deadline) => Course | undefined;
    onSeeAll: () => void;
}

const codeOf = (deadline: Deadline, course: Course | undefined): string => course?.code ?? deadline.courseName ?? 'Course';

export function PriorityCard({ focus, overdue, courseOf, onSeeAll }: PriorityCardProps) {
    const late = overdue.length > 0;
    const course = courseOf(focus);
    const rest = overdue.slice(1);
    const restCodes = [...new Set(rest.map((d) => codeOf(d, courseOf(d))))].join(' · ');
    const kicker = !late ? 'Due next' : overdue.length === 1 ? '1 assignment needs attention' : `${overdue.length} overdue assignments`;

    return (
        <section class={`ca-priority ${late ? 'ca-priority--late' : ''}`} style={{ '--ca-course': course?.color ?? 'var(--ca-muted)' }}>
            <p class="ca-priority-kicker">
                <span class="ca-dot" aria-hidden="true" />
                {kicker}
            </p>
            <div class="ca-priority-main">
                <h3 class="ca-priority-title">{focus.title}</h3>
                <p class="ca-priority-meta">
                    <span class="ca-code">{codeOf(focus, course)}</span>
                    <span class="ca-sep" aria-hidden="true" />
                    <span class="ca-priority-status">{late ? (focus.missing ? 'Missing' : 'Overdue') : relativeDue(focus.dueAt, new Date())}</span>
                </p>
            </div>
            {focus.url && (
                <a class="ca-btn-outline" href={focus.url} target="_blank" rel="noopener noreferrer">
                    Open assignment
                    <Icon name="arrowUpRight" size={15} />
                </a>
            )}
            {rest.length > 0 && (
                <button type="button" class="ca-priority-more" onClick={onSeeAll}>
                    <span>View {rest.length} more overdue</span>
                    <span class="ca-priority-codes">{restCodes}</span>
                    <Icon name="arrow" size={13} />
                </button>
            )}
        </section>
    );
}
