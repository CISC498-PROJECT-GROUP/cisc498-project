// Every finished term in the plan, newest first, with Stellic's recorded grade for each course.
// Reference, not something to act on — but it is what the Degree page is for, so it shows open.

import { Card } from '@/components/dashboard/card';
import type { Loadable } from '@/services/types';
import type { StellicPlan } from '@/services/types/stellic';

interface HistoryProps {
    plan: Loadable<StellicPlan | null>;
}

export function History({ plan }: HistoryProps) {
    const past = [...(plan.data?.terms ?? [])].filter((t) => t.when === 'past').reverse();
    const completed = past.flatMap((t) => t.courses).filter((c) => c.status === 'completed').length;
    return (
        <Card title="Academic history" source="stellic" aside={past.length > 0 ? `${past.length} terms · ${completed} courses` : undefined} states={[plan]} rows={2} class="ca-dash-card--wide">
            {past.length === 0 && <p class="ca-empty-line">No finished terms in your plan yet.</p>}
            {past.length > 0 && (
                <div class="ca-history">
                    <div class="ca-history-grid">
                        {past.map((t) => (
                            <div key={t.label} class="ca-history-term">
                                <h3 class="ca-history-label">{t.label}</h3>
                                <ul class="ca-history-list">
                                    {t.courses.map((c) => (
                                        <li key={c.code} class="ca-history-item">
                                            <span class="ca-history-code" title={c.name}>
                                                {c.code}
                                            </span>
                                            <span class="ca-history-grade">{c.grade ?? '—'}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}
