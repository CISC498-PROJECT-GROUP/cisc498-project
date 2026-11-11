// Degree (#/degree): the student's Stellic record in full — credits toward the degree and GPA, every
// program's requirements and what is still open, next term's plan and the terms after it, advising
// and plan review, and the academic history. Everything is shown as Stellic states it.

import { Advising } from '@/components/dashboard/advising';
import { DegreeProgress } from '@/components/dashboard/degree-progress';
import { History } from '@/components/dashboard/history';
import { NextTerm } from '@/components/dashboard/next-term';
import { DegreeSummary } from '@/components/degree/degree-summary';
import { LaterTerms } from '@/components/degree/later-terms';
import { PageHead } from '@/components/shell/page-head';
import { useRetryOnFocus } from '@/services/hooks/use-retry-on-focus';
import { useDegreeAudit, usePlanReview, useStellicPlan, useStellicProfile } from '@/services/hooks/use-stellic';

export function DegreePage() {
    const plan = useStellicPlan();
    const audit = useDegreeAudit();
    const profile = useStellicProfile();
    const review = usePlanReview();
    useRetryOnFocus([plan, audit, profile, review]);
    const p = profile.data;
    const facts = [plan.data?.programs.join(' + '), p?.standing, p?.graduation ? `Graduating ${p.graduation}` : null].filter(Boolean).join(' · ');

    return (
        <>
            <PageHead kicker="Stellic" title="Your degree" sub={facts || 'Your plan and degree audit, as Stellic has them.'} />
            <DegreeSummary audit={audit} />
            <div class="ca-dash-grid">
                <div class="ca-dash-col">
                    <DegreeProgress audit={audit} />
                </div>
                <div class="ca-dash-col">
                    <NextTerm plan={plan} />
                    <LaterTerms plan={plan} />
                    <Advising profile={profile} review={review} />
                </div>
            </div>
            <History plan={plan} />
        </>
    );
}
