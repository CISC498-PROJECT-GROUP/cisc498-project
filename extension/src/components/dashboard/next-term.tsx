// What the student's Stellic plan has for the term after this one — planned, or already
// registered — so registration never sneaks up on them.

import { Card } from '@/components/dashboard/card';
import { nextTerm } from '@/services/stellic/plan';
import type { Loadable } from '@/services/types';
import type { StellicPlan } from '@/services/types/stellic';

interface NextTermProps {
    plan: Loadable<StellicPlan | null>;
}

export function NextTerm({ plan }: NextTermProps) {
    const term = plan.data ? nextTerm(plan.data) : null;
    const credits = term?.courses.reduce((sum, c) => sum + c.credits, 0) ?? 0;
    const registered = term?.courses.filter((c) => c.status === 'enrolled').length ?? 0;
    return (
        <Card title={term ? `Next · ${term.label}` : 'Next semester'} source="stellic" aside={term ? `${credits} credits` : undefined} states={[plan]} rows={3}>
            {!term && <p class="ca-empty-line">Nothing planned after this term yet.</p>}
            {term && (
                <>
                    <p class="ca-next-note">{registered === term.courses.length ? 'Registered for every course.' : registered > 0 ? `Registered for ${registered} of ${term.courses.length}.` : 'Planned in Stellic — not registered yet.'}</p>
                    <ul class="ca-next-list">
                        {term.courses.map((c) => (
                            <li key={c.code} class="ca-next-item">
                                <span class="ca-next-code">{c.code}</span>
                                <span class="ca-next-title">{c.name}</span>
                                <span class={`ca-pill ${c.status === 'enrolled' ? 'ca-pill--done' : 'ca-pill--plain'}`}>{c.statusLabel ?? (c.status === 'enrolled' ? 'Registered' : 'Planned')}</span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </Card>
    );
}
