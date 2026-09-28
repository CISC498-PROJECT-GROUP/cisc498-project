// One upcoming item: a date tile, its course, title, time and points, and its status — linked to
// the item in Canvas.

import { dateTile, dueSoonLabel, formatTime } from '@/services/format/dates';
import type { Course, Deadline } from '@/services/types';

interface DeadlineRowProps {
    deadline: Deadline;
    course: Course | undefined;
    now: Date;
}

export function DeadlineRow({ deadline, course, now }: DeadlineRowProps) {
    const tile = dateTile(deadline.dueAt);
    const soon = deadline.submitted ? null : dueSoonLabel(deadline.dueAt, now);
    const meta = [tile.weekday, formatTime(deadline.dueAt), deadline.points === null ? null : `${deadline.points} pts`].filter(Boolean).join(' · ');
    const Tag = deadline.url ? 'a' : 'div';

    return (
        <Tag
            class={`ca-card ca-deadline ${deadline.submitted ? 'ca-deadline--done' : ''}`}
            style={{ '--ca-course': course?.color ?? 'var(--ca-faint)' }}
            {...(deadline.url ? { href: deadline.url, target: '_blank', rel: 'noopener noreferrer' } : {})}>
            <div class="ca-date-tile" aria-hidden="true">
                <span class="ca-date-month">{tile.month}</span>
                <span class="ca-date-day">{tile.day}</span>
            </div>
            <div class="ca-deadline-text">
                <span class="ca-course-tag">
                    <span class="ca-course-dot" aria-hidden="true" />
                    {course?.code ?? deadline.courseName ?? 'Personal'}
                </span>
                <span class="ca-strong">{deadline.title}</span>
                <span class="ca-muted">
                    <span class="ca-sr-only">
                        Due {tile.month} {tile.day},{' '}
                    </span>
                    {meta}
                </span>
            </div>
            {deadline.submitted && <span class="ca-status ca-status--done">Submitted</span>}
            {!deadline.submitted && deadline.missing && <span class="ca-status ca-status--missing">Missing</span>}
            {!deadline.missing && soon && <span class="ca-soon">{soon}</span>}
        </Tag>
    );
}
