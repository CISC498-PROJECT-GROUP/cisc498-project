// The dashboard page: Canvas and Stellic side by side. Every data source is loaded here, once, and
// handed down, so two cards that show the same thing (the plan, the deadlines) share one request.
//
// Left: this semester (both systems joined) and what's coming up (Canvas). Right: degree progress,
// next semester and advising (Stellic). Below: the academic history.

import { Advising } from '@/components/dashboard/advising';
import { ComingUp } from '@/components/dashboard/coming-up';
import { DegreeProgress } from '@/components/dashboard/degree-progress';
import { Hero } from '@/components/dashboard/hero';
import { History } from '@/components/dashboard/history';
import { NextTerm } from '@/components/dashboard/next-term';
import { ThisTerm } from '@/components/dashboard/this-term';
import { TopBar } from '@/components/dashboard/top-bar';
import { isWork } from '@/services/dashboard/work';
import { useCourses } from '@/services/hooks/use-courses';
import { useDeadlines } from '@/services/hooks/use-deadlines';
import { useRetryOnFocus } from '@/services/hooks/use-retry-on-focus';
import { useDegreeAudit, usePlanReview, useStellicPlan, useStellicProfile } from '@/services/hooks/use-stellic';
import { useStudent } from '@/services/hooks/use-student';

export function Dashboard() {
    const now = new Date();
    const student = useStudent();
    const courses = useCourses();
    const feed = useDeadlines();
    const deadlines = { ...feed, data: feed.data.filter(isWork) };
    const plan = useStellicPlan();
    const audit = useDegreeAudit();
    const profile = useStellicProfile();
    const review = usePlanReview();
    useRetryOnFocus([student, courses, feed, plan, audit, profile, review]);
    const firstName = student.data?.shortName.split(' ')[0] ?? profile.data?.name.split(' ')[0] ?? null;

    return (
        <div class="ca-page-shell">
            <TopBar />
            <main class="ca-page-main">
                <Hero now={now} firstName={firstName} profile={profile} plan={plan} audit={audit} deadlines={deadlines} />
                <div class="ca-dash-grid">
                    <div class="ca-dash-col">
                        <ThisTerm now={now} plan={plan} courses={courses} deadlines={deadlines} />
                        <ComingUp now={now} deadlines={deadlines} courses={courses} />
                    </div>
                    <div class="ca-dash-col">
                        <DegreeProgress audit={audit} />
                        <NextTerm plan={plan} />
                        <Advising profile={profile} review={review} />
                    </div>
                </div>
                <History plan={plan} />
                <p class="ca-page-foot">Read live from your own Canvas and Stellic sessions in this browser. Nothing is stored or sent anywhere else.</p>
            </main>
        </div>
    );
}
