// Deadlines (#/deadlines): the next two weeks of Canvas work, and turning an assignment in. Submit
// on a row opens the submit panel beside the list (on a phone, in place of it, with a way back).
// Escape closes the panel.

import { useEffect, useState } from 'preact/hooks';
import { Icon } from '@/components/common/icon';
import { Segmented } from '@/components/common/segmented';
import { DeadlineList } from '@/components/deadlines/deadline-list';
import { PageHead } from '@/components/shell/page-head';
import { SubmitView } from '@/components/submit/submit-view';
import { rangeLabel } from '@/services/format/dates';
import type { DeadlineFilter } from '@/services/format/group-deadlines';
import { useCourses } from '@/services/hooks/use-courses';
import { useDeadlines, WINDOW_DAYS } from '@/services/hooks/use-deadlines';
import type { Deadline } from '@/services/types';

const FILTERS: { value: DeadlineFilter; label: string }[] = [
    { value: 'todo', label: 'To do' },
    { value: 'all', label: 'All' },
];

type Submittable = Deadline & { courseId: string; assignmentId: string };

export function DeadlinesPage({ onAsk }: { onAsk: (question: string) => void }) {
    const deadlines = useDeadlines();
    const courses = useCourses();
    const [filter, setFilter] = useState<DeadlineFilter>('todo');
    const [submitting, setSubmitting] = useState<Submittable | null>(null);
    const ready = !deadlines.loading && !deadlines.error;

    useEffect(() => {
        if (!submitting) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSubmitting(null);
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [submitting]);

    const open = (d: Deadline) => {
        if (d.courseId && d.assignmentId) setSubmitting({ ...d, courseId: d.courseId, assignmentId: d.assignmentId });
    };
    const done = () => {
        setSubmitting(null);
        deadlines.retry();
    };

    return (
        <>
            <PageHead
                kicker={rangeLabel(new Date(), WINDOW_DAYS)}
                title="Deadlines"
                sub={`Everything due in the next ${WINDOW_DAYS} days, across every course, from Canvas.`}
                actions={
                    <>
                        <Segmented label="Show" value={filter} options={FILTERS} onChange={setFilter} />
                        {ready && (
                            <button type="button" class="ca-btn ca-btn--quiet" onClick={() => onAsk('Help me plan my week: what should I work on first, given what is due and how much each is worth?')}>
                                <Icon name="sparkle" size={15} />
                                Plan my week
                            </button>
                        )}
                    </>
                }
            />
            <div class={`ca-deadlines ${submitting ? 'ca-deadlines--submitting' : ''}`}>
                <DeadlineList deadlines={deadlines} courses={courses.data} filter={filter} selected={submitting?.id ?? null} onSubmit={open} />
                {submitting && (
                    <aside class="ca-submit-panel" aria-label={`Submit ${submitting.title}`}>
                        <header class="ca-submit-panel-head">
                            <h2 class="ca-dash-card-title">Submit</h2>
                            <button type="button" class="ca-icon-btn" onClick={() => setSubmitting(null)} aria-label="Close the submit panel" title="Close (Esc)">
                                <Icon name="close" size={18} />
                            </button>
                        </header>
                        <SubmitView key={submitting.id} deadline={submitting} onDone={done} />
                    </aside>
                )}
            </div>
        </>
    );
}
