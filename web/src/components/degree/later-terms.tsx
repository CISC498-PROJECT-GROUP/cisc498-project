// The rest of the student's Stellic plan: every term after next, each with its planned courses and
// credits. Next term has its own card (NextTerm); this one is hidden when nothing is planned past it.

import { Card } from '@/components/dashboard/card';
import { nextTerm } from '@/services/stellic/plan';
import type { Loadable } from '@/services/types';
import type { StellicPlan } from '@/services/types/stellic';

export function LaterTerms({ plan }: { plan: Loadable<StellicPlan | null> }) {
    const data = plan.data;
    if (!data) return null;
    const next = nextTerm(data);
    const later = data.terms.filter((t) => t.when === 'future' && t !== next && (next === null || data.terms.indexOf(t) > data.terms.indexOf(next)));
    if (later.length === 0) return null;
    return (
        <Card title="Later in your plan" source="stellic" aside={`${later.length} ${later.length === 1 ? 'term' : 'terms'}`}>
            <div class="ca-later">
                {later.map((t) => (
                    <div key={t.label} class="ca-later-term">
                        <h3 class="ca-history-label">
                            {t.label}
                            <span class="ca-faint"> · {t.courses.reduce((n, c) => n + c.credits, 0)} cr</span>
                        </h3>
                        <ul class="ca-later-list">
                            {t.courses.map((c) => (
                                <li key={c.code} title={c.name}>
                                    {c.code}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </Card>
    );
}
