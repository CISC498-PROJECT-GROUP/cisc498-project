// One dated item in a day group: course colour, title, course · time · points, and a status pill.
// The whole row links to the item in Canvas.

import { formatTime } from '@/services/format/dates';
import type { Course, Deadline } from '@/services/types';

interface DeadlineRowProps {
    deadline: Deadline;
    course: Course | undefined;
    overdue: boolean;
}

/** Only status the day heading doesn't already say: turned in, or overdue. */
function Status({ deadline, overdue }: { deadline: Deadline; overdue: boolean }) {
    if (deadline.submitted) return <span class="ca-pill ca-pill--done">Done</span>;
    if (deadline.missing || overdue) return <span class="ca-pill ca-pill--alert">{deadline.missing ? 'Missing' : 'Late'}</span>;
    return null;
}

export function DeadlineRow({ deadline, course, overdue }: DeadlineRowProps) {
    const meta = [course?.code ?? deadline.courseName, overdue ? `was due ${deadline.dueAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : formatTime(deadline.dueAt), deadline.points === null ? null : `${deadline.points} pts`]
        .filter(Boolean)
        .join(' · ');
    const Tag = deadline.url ? 'a' : 'div';

    return (
        <Tag class={`ca-row ${deadline.submitted ? 'ca-row--done' : ''}`} style={{ '--ca-course': course?.color ?? 'var(--ca-faint)' }} {...(deadline.url ? { href: deadline.url, target: '_blank', rel: 'noopener noreferrer' } : {})}>
            <span class="ca-row-bar" aria-hidden="true" />
            <span class="ca-row-main">
                <span class="ca-row-title">{deadline.title}</span>
                <span class="ca-row-meta">{meta}</span>
            </span>
            <Status deadline={deadline} overdue={overdue} />
        </Tag>
    );
}
