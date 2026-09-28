// The home screen's "Up next": the next few things not yet turned in, so the most common question
// is answered before it is asked. Overdue work leads.

import { formatTime, dayLabel } from '@/services/format/dates';
import { useCourses } from '@/services/hooks/use-courses';
import { useDeadlines } from '@/services/hooks/use-deadlines';

const SHOW = 3;

export function UpNext({ onSeeAll }: { onSeeAll: () => void }) {
    const deadlines = useDeadlines();
    const courses = useCourses();
    if (deadlines.loading || deadlines.error) return null;

    const now = new Date();
    const open = deadlines.data.filter((d) => !d.submitted);
    const next = [...open.filter((d) => d.dueAt < now), ...open.filter((d) => d.dueAt >= now)].slice(0, SHOW);

    return (
        <section class="ca-upnext">
            <div class="ca-upnext-head">
                <h3 class="ca-group-label">Up next</h3>
                <button type="button" class="ca-link" onClick={onSeeAll}>
                    See all
                </button>
            </div>
            {next.length === 0 ? (
                <p class="ca-upnext-empty">Nothing due in the next two weeks.</p>
            ) : (
                <div class="ca-list-card">
                    {next.map((d) => {
                        const course = courses.data.find((c) => c.id === d.courseId);
                        const late = d.dueAt < now;
                        return (
                            <a key={d.id} class="ca-row ca-row--compact" href={d.url ?? undefined} target="_blank" rel="noopener noreferrer" style={{ '--ca-course': course?.color ?? 'var(--ca-faint)' }}>
                                <span class="ca-row-bar" aria-hidden="true" />
                                <span class="ca-row-main">
                                    <span class="ca-row-title">{d.title}</span>
                                    <span class="ca-row-meta">{course?.code ?? d.courseName}</span>
                                </span>
                                <span class={late ? 'ca-when ca-when--late' : 'ca-when'}>
                                    {late ? 'Overdue' : dayLabel(d.dueAt, now)}
                                    {!late && <span class="ca-when-time">{formatTime(d.dueAt)}</span>}
                                </span>
                            </a>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
