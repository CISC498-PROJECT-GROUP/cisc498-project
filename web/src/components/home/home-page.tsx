// Home (#/): Canvas and Stellic side by side, with a way into the assistant and registration. Every
// data source is loaded here, once, and handed down, so two cards that show the same thing (the
// plan, the deadlines) share one request.
//
// Left: this semester (both systems joined) and what's coming up (Canvas). Right: the assistant,
// registration (WebReg), degree progress at a glance and advising (Stellic).

import { Advising } from '@/components/dashboard/advising';
import { ComingUp } from '@/components/dashboard/coming-up';
import { DegreeProgress } from '@/components/dashboard/degree-progress';
import { Hero } from '@/components/dashboard/hero';
import { ThisTerm } from '@/components/dashboard/this-term';
import { AskCard } from '@/components/home/ask-card';
import { RegistrationCard } from '@/components/schedule/registration-card';
import { isWork } from '@/services/dashboard/work';
import { useCourses } from '@/services/hooks/use-courses';
import { useDeadlines } from '@/services/hooks/use-deadlines';
import { useRetryOnFocus } from '@/services/hooks/use-retry-on-focus';
import { useDegreeAudit, usePlanReview, useStellicPlan, useStellicProfile } from '@/services/hooks/use-stellic';

export function HomePage({ onAsk }: { onAsk: (question: string) => void }) {
    const now = new Date();
    const courses = useCourses();
    const feed = useDeadlines();
    const deadlines = { ...feed, data: feed.data.filter(isWork) };
    const plan = useStellicPlan();
    const audit = useDegreeAudit();
    const profile = useStellicProfile();
    const review = usePlanReview();
    useRetryOnFocus([courses, feed, plan, audit, profile, review]);

    return (
        <>
            <Hero now={now} profile={profile} plan={plan} audit={audit} deadlines={deadlines} />
            <div class="ca-dash-grid">
                <div class="ca-dash-col">
                    <ThisTerm now={now} plan={plan} courses={courses} deadlines={deadlines} />
                    <ComingUp now={now} deadlines={deadlines} courses={courses} />
                </div>
                <div class="ca-dash-col">
                    <AskCard onAsk={onAsk} overdue={deadlines.data.some((d) => !d.submitted && d.dueAt.getTime() < now.getTime())} />
                    <RegistrationCard />
                    <DegreeProgress audit={audit} summary />
                    <Advising profile={profile} review={review} />
                </div>
            </div>
            <p class="ca-page-foot">Read live from your own Canvas, Stellic and WebReg sessions. Nothing is stored.</p>
        </>
    );
}
