// Everything due in the next two weeks, across all courses, soonest first.

import { LoadState } from '@/components/common/load-state';
import { DeadlineRow } from '@/components/deadlines/deadline-row';
import { useCourses } from '@/services/hooks/use-courses';
import { useDeadlines, WINDOW_DAYS } from '@/services/hooks/use-deadlines';

export function DeadlinesView() {
    const deadlines = useDeadlines();
    const courses = useCourses();
    const now = new Date();
    const open = deadlines.data.filter((d) => !d.submitted).length;

    return (
        <div class="ca-body ca-list">
            <LoadState state={deadlines} label="your deadlines" />
            {!deadlines.loading && !deadlines.error && (
                <div class="ca-list-head">
                    <span class="ca-muted">
                        Next {WINDOW_DAYS} days · {open} to do{open !== deadlines.data.length ? `, ${deadlines.data.length - open} done` : ''}
                    </span>
                </div>
            )}
            {!deadlines.loading && !deadlines.error && deadlines.data.length === 0 && <p class="ca-empty">Nothing due in the next two weeks.</p>}
            {deadlines.data.map((deadline) => (
                <DeadlineRow key={deadline.id} deadline={deadline} course={courses.data.find((c) => c.id === deadline.courseId)} now={now} />
            ))}
        </div>
    );
}
