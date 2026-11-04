// This semester, from both systems at once: each course the student is registered for in Stellic,
// with its credits and registration status, joined to its Canvas site for the current grade and the
// next piece of open work. A course with no Canvas site still shows, from Stellic alone.

import { Card } from '@/components/dashboard/card';
import { TermCourseRow } from '@/components/dashboard/term-course-row';
import { joinTerm, otherCanvas } from '@/services/dashboard/course-match';
import { currentTerm } from '@/services/stellic/plan';
import type { Course, Deadline, Loadable } from '@/services/types';
import type { StellicPlan } from '@/services/types/stellic';

interface ThisTermProps {
    now: Date;
    plan: Loadable<StellicPlan | null>;
    courses: Loadable<Course[]>;
    deadlines: Loadable<Deadline[]>;
}

export function ThisTerm({ now, plan, courses, deadlines }: ThisTermProps) {
    const term = plan.data ? currentTerm(plan.data) : null;
    const rows = term ? joinTerm(term, courses.data, deadlines.data, now) : [];
    const others = courses.loading ? [] : otherCanvas(rows, courses.data);
    const credits = term?.courses.reduce((sum, c) => sum + c.credits, 0) ?? 0;

    return (
        <Card title={term ? `This semester · ${term.label}` : 'This semester'} source="both" aside={term ? `${credits} credits` : undefined} states={[plan]} rows={5} class="ca-dash-card--term">
            {!term && <p class="ca-empty-line">Stellic has no current or upcoming term in your plan.</p>}
            {term && (
                <ul class="ca-term-list">
                    {rows.map((row) => (
                        <TermCourseRow key={row.plan.code} row={row} now={now} canvasLoading={courses.loading} />
                    ))}
                </ul>
            )}
            {courses.error && <p class="ca-empty-line">Canvas didn't answer, so grades and due dates are missing: {courses.error}</p>}
            {others.length > 0 && (
                <p class="ca-also">
                    <span class="ca-also-label">Also in Canvas</span>
                    {others.map((c) => (
                        <a key={c.id} class="ca-also-link" href={c.url} target="_blank" rel="noreferrer">
                            {c.name}
                        </a>
                    ))}
                </p>
            )}
        </Card>
    );
}
