// One dated item in a day group: course colour, title, course · time · points, and a status pill.
// The title links to the item in Canvas; an assignment not yet turned in also gets a Submit button
// that opens the submit view.

import { formatTime } from '@/services/format/dates';
import type { Course, Deadline } from '@/services/types';

interface DeadlineRowProps {
    deadline: Deadline;
    course: Course | undefined;
    overdue: boolean;
    onSubmit: (deadline: Deadline) => void;
}

/** Only status the day heading doesn't already say: turned in, or overdue. */
function Status({ deadline, overdue }: { deadline: Deadline; overdue: boolean }) {
    if (deadline.submitted) return <span class="ca-pill ca-pill--done">Done</span>;
    if (deadline.missing || overdue) return <span class="ca-pill ca-pill--alert">{deadline.missing ? 'Missing' : 'Late'}</span>;
    return null;
}

export function DeadlineRow({ deadline, course, overdue, onSubmit }: DeadlineRowProps) {
    const meta = [course?.code ?? deadline.courseName, overdue ? `was due ${deadline.dueAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : formatTime(deadline.dueAt), deadline.points === null ? null : `${deadline.points} pts`]
        .filter(Boolean)
        .join(' · ');
    const submittable = !deadline.submitted && deadline.assignmentId !== null && deadline.courseId !== null;

    return (
        <div class={`ca-row ${deadline.submitted ? 'ca-row--done' : ''}`} style={{ '--ca-course': course?.color ?? 'var(--ca-faint)' }}>
            <span class="ca-row-bar" aria-hidden="true" />
            <span class="ca-row-main">
                {deadline.url ? (
                    <a class="ca-row-title ca-row-link" href={deadline.url} target="_blank" rel="noopener noreferrer">
                        {deadline.title}
                    </a>
                ) : (
                    <span class="ca-row-title">{deadline.title}</span>
                )}
                <span class="ca-row-meta">{meta}</span>
            </span>
            <Status deadline={deadline} overdue={overdue} />
            {submittable && (
                <button type="button" class="ca-chip" onClick={() => onSubmit(deadline)} aria-label={`Submit ${deadline.title}`}>
                    Submit
                </button>
            )}
        </div>
    );
}
