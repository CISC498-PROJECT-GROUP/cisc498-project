// The top of the page: who the student is and three numbers that matter — cumulative GPA and
// credits toward the degree (both Stellic's), and how much Canvas work is open this week.

import { CreditBar } from '@/components/dashboard/credit-bar';
import { greeting } from '@/services/format/dates';
import { creditProgram } from '@/services/stellic/audit';
import type { Deadline, Loadable } from '@/services/types';
import type { DegreeAudit, StellicPlan, StellicProfile } from '@/services/types/stellic';

interface HeroProps {
    now: Date;
    firstName: string | null;
    profile: Loadable<StellicProfile | null>;
    plan: Loadable<StellicPlan | null>;
    audit: Loadable<DegreeAudit | null>;
    deadlines: Loadable<Deadline[]>;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const Pending = () => <span class="ca-skel ca-stat-skel" aria-label="Loading" />;

export function Hero({ now, firstName, profile, plan, audit, deadlines }: HeroProps) {
    const p = profile.data;
    const facts = [plan.data?.programs[0], p?.standing, p?.school, p?.graduation ? `Graduating ${p.graduation}` : null].filter(Boolean);
    const credits = audit.data ? creditProgram(audit.data) : null;
    const open = deadlines.data.filter((d) => !d.submitted && d.dueAt.getTime() >= now.getTime() && d.dueAt.getTime() - now.getTime() <= WEEK_MS);
    const overdue = deadlines.data.filter((d) => !d.submitted && d.dueAt.getTime() < now.getTime()).length;

    return (
        <div class="ca-hero">
            <div class="ca-hero-intro">
                <p class="ca-hero-hello">
                    {greeting(now)}
                    {firstName ? `, ${firstName}` : ''}.
                </p>
                <h1 class="ca-hero-title">Your semester at a glance</h1>
                {facts.length > 0 && <p class="ca-hero-facts">{facts.join(' · ')}</p>}
            </div>
            <div class="ca-stats">
                <div class="ca-stat">
                    <span class="ca-stat-label">Cumulative GPA</span>
                    <span class="ca-stat-value">{audit.loading ? <Pending /> : audit.data?.gpa != null ? audit.data.gpa.toFixed(2) : '—'}</span>
                    <span class="ca-stat-note">from Stellic</span>
                </div>
                <div class="ca-stat ca-stat--wide">
                    <span class="ca-stat-label">Credits toward your degree</span>
                    {audit.loading ? <Pending /> : credits ? <CreditBar credits={credits.credits} /> : <span class="ca-stat-value">—</span>}
                </div>
                <div class="ca-stat">
                    <span class="ca-stat-label">Due in the next 7 days</span>
                    <span class="ca-stat-value">{deadlines.loading ? <Pending /> : deadlines.error ? '—' : open.length}</span>
                    <span class={`ca-stat-note ${overdue > 0 ? 'ca-stat-note--alert' : ''}`}>{overdue > 0 ? `${overdue} overdue` : 'from Canvas'}</span>
                </div>
            </div>
        </div>
    );
}
