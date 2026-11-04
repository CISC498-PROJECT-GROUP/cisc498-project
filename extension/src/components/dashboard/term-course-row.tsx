// One course this semester: Stellic's code, title, credits and registration status on the left;
// Canvas's current grade and the next open item on the right, linked to the course site.

import { Icon } from '@/components/common/icon';
import type { TermCourse } from '@/services/dashboard/course-match';
import { relativeDue } from '@/services/format/dates';

interface TermCourseRowProps {
    row: TermCourse;
    now: Date;
    canvasLoading: boolean;
}

export function TermCourseRow({ row, now, canvasLoading }: TermCourseRowProps) {
    const { plan, canvas, next, openCount } = row;
    const color = canvas?.color ?? 'var(--ca-line-2)';
    return (
        <li class="ca-term-row" style={{ '--ca-course': color }}>
            <span class="ca-term-swatch" aria-hidden="true" />
            <div class="ca-term-main">
                <div class="ca-term-name">
                    <span class="ca-term-code">{plan.code}</span>
                    <span class="ca-term-title">{plan.name}</span>
                </div>
                <div class="ca-term-meta">
                    <span>{plan.credits} cr</span>
                    {plan.statusLabel && <span>{plan.statusLabel}</span>}
                    {next && (
                        <a class="ca-term-next" href={next.url ?? canvas?.url} target="_blank" rel="noreferrer">
                            Next: {next.title} · {relativeDue(next.dueAt, now)}
                            {openCount > 1 && <span class="ca-term-more"> +{openCount - 1} more</span>}
                        </a>
                    )}
                    {canvas && !next && !canvasLoading && <span class="ca-faint">Nothing open in the next two weeks</span>}
                </div>
            </div>
            <div class="ca-term-grade">
                {canvasLoading ? (
                    <span class="ca-skel ca-grade-skel" aria-label="Loading" />
                ) : canvas ? (
                    <a class="ca-grade-link" href={canvas.url} target="_blank" rel="noreferrer" aria-label={`Open ${plan.code} in Canvas`}>
                        <span class="ca-grade-value">{canvas.percent != null ? `${canvas.percent.toFixed(1)}%` : '—'}</span>
                        <span class="ca-grade-letter">{canvas.letter ?? (canvas.percent == null ? 'No grade yet' : '')}</span>
                        <Icon name="arrowUpRight" size={13} />
                    </a>
                ) : (
                    <span class="ca-faint ca-small">No Canvas site</span>
                )}
            </div>
        </li>
    );
}
