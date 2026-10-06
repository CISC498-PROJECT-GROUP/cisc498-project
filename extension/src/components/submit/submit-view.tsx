// Turning in one assignment, opened from its row in the deadlines list. Shows what Canvas will take
// for it — or why it won't take anything here — then the form, then a receipt with Canvas's own
// timestamp once it is in.

import { Icon } from '@/components/common/icon';
import { LoadState } from '@/components/common/load-state';
import { SubmitForm } from '@/components/submit/submit-form';
import { localStamp } from '@/services/format/dates';
import { useCourses } from '@/services/hooks/use-courses';
import { useSubmit } from '@/services/hooks/use-submit';
import { useSubmitTarget } from '@/services/hooks/use-submit-target';
import type { Deadline, SubmitTarget } from '@/services/types';

interface SubmitViewProps {
    deadline: Deadline & { courseId: string; assignmentId: string };
    onDone: () => void;
}

function OpenInCanvas({ url }: { url: string | null }) {
    return url ? (
        <a class="ca-link" href={url} target="_blank" rel="noopener noreferrer">
            Open in Canvas <Icon name="external" size={13} />
        </a>
    ) : null;
}

/** When the widget can't send this one: say why, and hand over to Canvas. */
function CantSubmit({ target }: { target: SubmitTarget }) {
    const reason =
        target.blocked ?? (target.canvasOnly ? 'This assignment is turned in through Canvas itself (a quiz, an external tool or a recording).' : 'There is nothing to turn in online for this one — check the instructions for how to hand it in.');
    return (
        <div class="ca-notice">
            <p>{reason}</p>
            <OpenInCanvas url={target.url} />
        </div>
    );
}

export function SubmitView({ deadline, onDone }: SubmitViewProps) {
    const target = useSubmitTarget(deadline.courseId, deadline.assignmentId);
    const sender = useSubmit(target.data);
    const course = useCourses().data.find((c) => c.id === deadline.courseId);
    const t = target.data;
    const meta = [course?.code ?? deadline.courseName, `due ${localStamp(deadline.dueAt.toISOString())}`, deadline.points === null ? null : `${deadline.points} pts`].filter(Boolean).join(' · ');

    return (
        <div class="ca-body">
            <div class="ca-submit-head" style={{ '--ca-course': course?.color ?? 'var(--ca-faint)' }}>
                <span class="ca-row-bar" aria-hidden="true" />
                <span class="ca-row-main">
                    <span class="ca-row-title">{deadline.title}</span>
                    <span class="ca-row-meta">{meta}</span>
                </span>
            </div>
            <LoadState state={target} rows={2} />
            {t && sender.submittedAt && (
                <div class="ca-receipt" role="status">
                    <span class="ca-empty-icon" aria-hidden="true">
                        <Icon name="check" size={22} />
                    </span>
                    <p class="ca-receipt-title">Submitted</p>
                    <p class="ca-row-meta">Canvas recorded it on {localStamp(sender.submittedAt.toISOString())}.</p>
                    <div class="ca-confirm-actions">
                        <OpenInCanvas url={t.url} />
                        <button type="button" class="ca-btn ca-btn--primary" onClick={onDone}>
                            Back to deadlines
                        </button>
                    </div>
                </div>
            )}
            {t && !sender.submittedAt && (t.blocked || t.kinds.length === 0) && <CantSubmit target={t} />}
            {t && !sender.submittedAt && !t.blocked && t.kinds.length > 0 && (
                <>
                    {t.submittedAt && <p class="ca-notice">You already submitted this on {localStamp(t.submittedAt.toISOString())}. Submitting again adds a new attempt.</p>}
                    <SubmitForm target={t} sender={sender} courseCode={course?.code ?? deadline.courseName ?? 'this course'} />
                </>
            )}
        </div>
    );
}
