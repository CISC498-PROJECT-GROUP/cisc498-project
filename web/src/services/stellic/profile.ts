// Who the student is in Stellic — standing, school, expected graduation, advisors — and where their
// plan review stands. Pure mappers; the requests live in load.ts.

import { seasonName } from '@/services/stellic/plan';
import type { RawPerson, RawProfile, RawReviewSummary } from '@/services/stellic/stellic-types';
import type { Advisor, PlanReview, StellicProfile } from '@/services/types/stellic';

const fullName = (p: RawPerson): string => [p.first_name, p.last_name].filter(Boolean).join(' ').trim();

const advisor = (p: RawPerson): Advisor => ({ name: fullName(p) || 'Advisor', email: p.email ?? null });

export function mapProfile(raw: RawProfile): StellicProfile {
    const grad = raw.expected_graduation_usem;
    const season = seasonName(grad?.semester);
    const advisors = [raw.primary_advisor, ...(raw.secondary_advisors ?? [])].filter((p): p is RawPerson => !!p).map(advisor);
    return { name: fullName(raw), standing: raw.level_name ?? null, school: raw.school ?? null, graduation: season && grad?.year ? `${season} ${grad.year}` : null, advisors };
}

export function mapReview(raw: RawReviewSummary): PlanReview {
    const open = raw.data?.open_review_details;
    return { reviewed: raw.data?.is_plan_reviewed === true, openWith: open?.reviewer ? fullName(open.reviewer) || null : null, openSince: open?.review_initiated_at ?? null };
}
