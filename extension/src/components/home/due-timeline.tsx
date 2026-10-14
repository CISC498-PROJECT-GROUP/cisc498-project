// The home screen's next 48 hours, as a short timeline in course colours. Two items show; the rest
// are one tap away in the deadlines view.

import { Icon } from '@/components/common/icon';
import { relativeDue } from '@/services/format/dates';
import type { Course, Deadline } from '@/services/types';

const SHOW = 2;

interface DueTimelineProps {
    soon: Deadline[];
    /** True when the priority card above is already showing the next upcoming item. */
    afterFocus: boolean;
    courseOf: (deadline: Deadline) => Course | undefined;
    onSeeAll: () => void;
}

export function DueTimeline({ soon, afterFocus, courseOf, onSeeAll }: DueTimelineProps) {
    const now = new Date();
    const more = soon.length - SHOW;
    const heading = soon.length === 0 ? `Nothing ${afterFocus ? 'else ' : ''}due in 48h` : `${soon.length} ${afterFocus ? 'more ' : ''}due in 48h`;

    return (
        <section class="ca-timeline">
            <div class="ca-section-head">
                <h3 class="ca-section-title">{heading}</h3>
                <button type="button" class="ca-link" onClick={onSeeAll}>
                    {more > 0 ? `See all ${soon.length}` : 'See all'}
                </button>
            </div>
            {soon.length > 0 && (
                <ol class="ca-timeline-list">
                    {soon.slice(0, SHOW).map((d) => {
                        const course = courseOf(d);
                        return (
                            <li key={d.id} class="ca-timeline-item" style={{ '--ca-course': course?.color ?? 'var(--ca-muted)' }}>
                                <span class="ca-timeline-point" aria-hidden="true" />
                                <a class="ca-timeline-main" href={d.url ?? undefined} target="_blank" rel="noopener noreferrer">
                                    <span class="ca-timeline-meta">
                                        <span class="ca-code">{course?.code ?? d.courseName}</span>
                                        <span class="ca-timeline-when">{relativeDue(d.dueAt, now)}</span>
                                    </span>
                                    <span class="ca-timeline-title">{d.title}</span>
                                </a>
                            </li>
                        );
                    })}
                </ol>
            )}
            {more > 0 && (
                <button type="button" class="ca-link ca-timeline-more" onClick={onSeeAll}>
                    View {more} more due in 48h
                    <Icon name="arrow" size={13} />
                </button>
            )}
        </section>
    );
}
