// Open Canvas work for the next two weeks, overdue first, grouped by day — the planner feed the
// widget's deadlines view reads, tagged here with the Stellic-style course code.

import { Card } from '@/components/dashboard/card';
import { courseKey } from '@/services/dashboard/course-match';
import { formatTime } from '@/services/format/dates';
import { groupDeadlines } from '@/services/format/group-deadlines';
import { WINDOW_DAYS } from '@/services/hooks/use-deadlines';
import type { Course, Deadline, Loadable } from '@/services/types';

interface ComingUpProps {
    now: Date;
    deadlines: Loadable<Deadline[]>;
    courses: Loadable<Course[]>;
}

const LIMIT = 14;

export function ComingUp({ now, deadlines, courses }: ComingUpProps) {
    const groups = groupDeadlines(deadlines.data, now, 'todo');
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    let shown = 0;
    const courseOf = (d: Deadline) => courses.data.find((c) => c.id === d.courseId);

    return (
        <Card title="Coming up" source="canvas" aside={`Next ${WINDOW_DAYS} days`} states={[deadlines]} rows={4}>
            {total === 0 && <p class="ca-empty-line">Nothing open in the next two weeks.</p>}
            {groups.map((group) => {
                if (shown >= LIMIT) return null;
                const items = group.items.slice(0, LIMIT - shown);
                shown += items.length;
                return (
                    <div key={group.label} class="ca-due-day">
                        <h3 class={`ca-due-day-label ${group.overdue ? 'ca-due-day-label--alert' : ''}`}>{group.label}</h3>
                        <ul class="ca-due-list">
                            {items.map((d) => {
                                const course = courseOf(d);
                                return (
                                    <li key={d.id} class="ca-due-item" style={{ '--ca-course': course?.color ?? 'var(--ca-line-2)' }}>
                                        <span class="ca-due-code">{courseKey(course?.code ?? d.courseName) ?? course?.name ?? d.courseName ?? '—'}</span>
                                        <a class="ca-due-title" href={d.url ?? undefined} target="_blank" rel="noreferrer">
                                            {d.title}
                                        </a>
                                        <span class="ca-due-time">{group.overdue ? `${d.dueAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : formatTime(d.dueAt)}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            })}
            {total > shown && <p class="ca-faint ca-small ca-due-more">+{total - shown} more in Canvas</p>}
        </Card>
    );
}
