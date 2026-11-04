// The Stellic requests the dashboard makes, each memoised for the page's lifetime (a failure is not
// cached, so a retry asks again). Order matters for speed: the plan call needs no arguments — Stellic
// answers with the signed-in student's primary plan — and its plan id is all the audit needs, so the
// two run back to back while the slower profile call (~5 s, it carries the student's whole record)
// runs alongside. Stellic's own app also calls /planner/getinitdata/ first; that is ~750 KB and
// ~10 s and gives nothing these calls don't, so it is skipped.

import { mapAudit } from '@/services/stellic/audit';
import { mapPlan } from '@/services/stellic/plan';
import { mapProfile, mapReview } from '@/services/stellic/profile';
import { stellicGet, stellicPostForm, stellicPostJson } from '@/services/stellic/stellic-api';
import { installStellicRule } from '@/services/stellic/stellic-rule';
import type { RawAudit, RawProfile, RawReviewSummary, RawStudentPlan } from '@/services/stellic/stellic-types';
import type { DegreeAudit, PlanReview, StellicPlan, StellicProfile } from '@/services/types/stellic';

function memo<T>(load: () => Promise<T>): () => Promise<T> {
    let pending: Promise<T> | null = null;
    return () => {
        pending ??= load().catch((error) => {
            pending = null;
            throw error;
        });
        return pending;
    };
}

/** The header rule must be in place before the first POST; installing it is idempotent. */
const ready = memo(installStellicRule);

export const loadPlan = memo(async (): Promise<StellicPlan> => {
    await ready();
    return mapPlan(await stellicPostForm<RawStudentPlan>('/planner/getstudentplan/', { include_grades: 'true' }), new Date());
});

export const loadAudit = memo(async (): Promise<DegreeAudit> => {
    const { planId } = await loadPlan();
    const body = { mainaudit: true, plan_id: planId, official: false, isTemplate: false, req_tree: true, course_plan_info: false, student_info: true, placeholders_info: false, uids: [] };
    return mapAudit(await stellicPostJson<RawAudit>('/planner/getauditinfo/', body));
});

const loadProfileRaw = memo(async (): Promise<RawProfile & { username?: string }> => {
    await ready();
    return stellicPostForm<RawProfile & { username?: string }>('/planner/getstudentprofile/', {});
});

export const loadProfile = memo(async (): Promise<StellicProfile> => mapProfile(await loadProfileRaw()));

export const loadReview = memo(async (): Promise<PlanReview> => {
    const { username } = await loadProfileRaw();
    if (!username) return { reviewed: false, openWith: null, openSince: null };
    return mapReview(await stellicGet<RawReviewSummary>(`/planner/plan-review-summary/?student_username=${encodeURIComponent(username)}`));
});
