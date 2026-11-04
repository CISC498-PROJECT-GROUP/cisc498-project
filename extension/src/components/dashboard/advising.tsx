// Who advises the student and where their plan review stands, both from Stellic.

import { Icon } from '@/components/common/icon';
import { Card } from '@/components/dashboard/card';
import type { Loadable } from '@/services/types';
import type { PlanReview, StellicProfile } from '@/services/types/stellic';

interface AdvisingProps {
    profile: Loadable<StellicProfile | null>;
    review: Loadable<PlanReview | null>;
}

const since = (iso: string | null): string => (iso ? ` since ${new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : '');

function reviewLine(review: PlanReview | null): string | null {
    if (!review) return null;
    if (review.reviewed) return 'Your plan has been reviewed.';
    if (review.openWith) return `Plan review open with ${review.openWith}${since(review.openSince)}.`;
    return 'Your plan has not been reviewed yet.';
}

export function Advising({ profile, review }: AdvisingProps) {
    const advisors = profile.data?.advisors ?? [];
    const line = reviewLine(review.data);
    return (
        <Card title="Advising" source="stellic" states={[profile]} rows={2}>
            {advisors.length === 0 && <p class="ca-empty-line">Stellic lists no advisor for you.</p>}
            <ul class="ca-advisor-list">
                {advisors.map((a) => (
                    <li key={a.name} class="ca-advisor">
                        <span class="ca-advisor-initial" aria-hidden="true">
                            {a.name.charAt(0)}
                        </span>
                        <span class="ca-advisor-name">{a.name}</span>
                        {a.email && (
                            <a class="ca-chip" href={`mailto:${a.email}`}>
                                <Icon name="compose" size={13} />
                                Email
                            </a>
                        )}
                    </li>
                ))}
            </ul>
            {line && <p class="ca-faint ca-small ca-review-line">{line}</p>}
        </Card>
    );
}
