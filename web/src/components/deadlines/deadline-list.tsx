// Everything due in the next two weeks, grouped by day, overdue work first. "To do" hides what is
// already turned in; "All" shows it (the filter is the page's). An open assignment's Submit button
// hands it to the page's submit panel; the row being submitted is marked.

import { Icon } from '@/components/common/icon';
import { LoadState } from '@/components/common/load-state';
import { DeadlineRow } from '@/components/deadlines/deadline-row';
import { groupDeadlines, type DeadlineFilter } from '@/services/format/group-deadlines';
import type { Course, Deadline, Loadable } from '@/services/types';

interface DeadlineListProps {
    deadlines: Loadable<Deadline[]>;
    courses: Course[];
    filter: DeadlineFilter;
    selected: string | null;
    onSubmit: (deadline: Deadline) => void;
}

export function DeadlineList({ deadlines, courses, filter, selected, onSubmit }: DeadlineListProps) {
    const groups = groupDeadlines(deadlines.data, new Date(), filter);
    const ready = !deadlines.loading && !deadlines.error;

    return (
        <div class="ca-deadline-list">
            <LoadState state={deadlines} rows={5} />
            {ready && groups.length === 0 && (
                <div class="ca-empty-state">
                    <span class="ca-empty-icon" aria-hidden="true">
                        <Icon name="check" size={22} />
                    </span>
                    <p>{filter === 'todo' ? "You're all caught up for the next two weeks." : 'Nothing dated in the next two weeks.'}</p>
                </div>
            )}
            {groups.map((group) => (
                <section key={group.label} class="ca-group">
                    <h2 class={`ca-group-label ${group.overdue ? 'ca-group-label--alert' : ''}`}>
                        {group.label}
                        <span class="ca-group-count">{group.items.length}</span>
                    </h2>
                    <div class="ca-cards">
                        {group.items.map((d) => (
                            <DeadlineRow key={d.id} deadline={d} course={courses.find((c) => c.id === d.courseId)} overdue={group.overdue} selected={selected === d.id} onSubmit={onSubmit} />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
