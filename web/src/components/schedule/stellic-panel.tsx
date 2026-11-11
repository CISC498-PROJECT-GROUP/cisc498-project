// "From your Stellic plan": the courses the student planned in Stellic for the term being built,
// each one click from its sections in search, and marked when it is already registered or planned
// here. The Stellic term is matched to WebReg's by season and year.

import { LoadState } from '@/components/common/load-state';
import { useStellicPlan } from '@/services/hooks/use-stellic';
import { courseKey } from '@/services/webreg/section-id';
import { matchStellicTerm, seasonOf } from '@/services/webreg/term-match';

interface StellicPanelProps {
    termLabel: string;
    /** By courseKey ("CISC108"): "Registered" or "In plan". */
    status: Map<string, string>;
    onSearch: (code: string) => void;
}

export function StellicPanel({ termLabel, status, onSearch }: StellicPanelProps) {
    const plan = useStellicPlan();
    const term = plan.data ? matchStellicTerm(termLabel, plan.data.terms) : null;
    const season = seasonOf(termLabel);
    const courses = term?.courses.filter((c) => c.status !== 'completed') ?? [];

    return (
        <section class="ca-dash-card ca-sched-stellic" aria-labelledby="ca-stellic-plan-title">
            <div class="ca-dash-card-head">
                <h2 class="ca-dash-card-title" id="ca-stellic-plan-title">
                    From your Stellic plan
                </h2>
                <span class="ca-source ca-source--stellic">Stellic</span>
            </div>
            {!plan.data ? (
                <LoadState state={plan} rows={2} />
            ) : !courses.length ? (
                <p class="ca-empty-line">Your Stellic plan has no courses for {season ? `${season.season} ${season.year}` : 'this term'}.</p>
            ) : (
                <ul class="ca-stellic-list">
                    {courses.map((c) => {
                        const here = status.get(courseKey(c.code));
                        return (
                            <li key={c.code} class="ca-stellic-row">
                                <span class="ca-stellic-text">
                                    <span class="ca-search-code">{c.code}</span>
                                    <span class="ca-muted ca-small">
                                        {c.name}
                                        {c.credits ? ` · ${c.credits} cr` : ''}
                                    </span>
                                </span>
                                {here ? (
                                    <span class={`ca-tag${here === 'Registered' ? ' ca-tag--done' : ''}`}>{here}</span>
                                ) : (
                                    <button type="button" class="ca-mini-btn" onClick={() => onSearch(c.code)} aria-label={`Find sections of ${c.code}`}>
                                        Find sections
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
