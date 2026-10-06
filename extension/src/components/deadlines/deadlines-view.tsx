// Everything due in the next two weeks, grouped by day, overdue work first. "To do" hides what is
// already turned in; "All" shows it. An open assignment's Submit button hands it to the submit view.

import { useState } from 'preact/hooks';
import { Icon } from '@/components/common/icon';
import { LoadState } from '@/components/common/load-state';
import { Segmented } from '@/components/common/segmented';
import { DeadlineRow } from '@/components/deadlines/deadline-row';
import { groupDeadlines, type DeadlineFilter } from '@/services/format/group-deadlines';
import { useCourses } from '@/services/hooks/use-courses';
import { useDeadlines } from '@/services/hooks/use-deadlines';
import type { Deadline } from '@/services/types';

const FILTERS: { value: DeadlineFilter; label: string }[] = [
    { value: 'todo', label: 'To do' },
    { value: 'all', label: 'All' },
];

interface DeadlinesViewProps {
    onAsk: (question: string) => void;
    onSubmit: (deadline: Deadline) => void;
}

export function DeadlinesView({ onAsk, onSubmit }: DeadlinesViewProps) {
    const deadlines = useDeadlines();
    const courses = useCourses();
    const [filter, setFilter] = useState<DeadlineFilter>('todo');
    const now = new Date();
    const groups = groupDeadlines(deadlines.data, now, filter);
    const ready = !deadlines.loading && !deadlines.error;

    return (
        <div class="ca-body">
            <div class="ca-toolbar">
                <span class="ca-toolbar-title">Next 14 days</span>
                <Segmented label="Show" value={filter} options={FILTERS} onChange={setFilter} />
            </div>
            <LoadState state={deadlines} rows={4} />
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
                    <h3 class={`ca-group-label ${group.overdue ? 'ca-group-label--alert' : ''}`}>
                        {group.label}
                        <span class="ca-group-count">{group.items.length}</span>
                    </h3>
                    <div class="ca-list-card">
                        {group.items.map((d) => (
                            <DeadlineRow key={d.id} deadline={d} course={courses.data.find((c) => c.id === d.courseId)} overdue={group.overdue} onSubmit={onSubmit} />
                        ))}
                    </div>
                </section>
            ))}
            {ready && groups.length > 0 && (
                <button type="button" class="ca-ask-row" onClick={() => onAsk('Help me plan my week: what should I work on first, given what is due and how much each is worth?')}>
                    Help me plan my week →
                </button>
            )}
        </div>
    );
}
