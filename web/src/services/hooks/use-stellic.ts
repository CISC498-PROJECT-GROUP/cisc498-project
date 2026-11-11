// The student's Stellic record for the dashboard page: the plan (every term and its courses), the
// degree audit, their profile (standing, graduation term, advisors) and where their plan review
// stands. Each loads independently, so a slow profile never holds up the plan.

import { useLoad } from '@/services/hooks/use-load';
import { loadAudit, loadPlan, loadProfile, loadReview } from '@/services/stellic/load';
import type { Loadable } from '@/services/types';
import type { DegreeAudit, PlanReview, StellicPlan, StellicProfile } from '@/services/types/stellic';

export const useStellicPlan = (): Loadable<StellicPlan | null> => useLoad(loadPlan, null);
export const useDegreeAudit = (): Loadable<DegreeAudit | null> => useLoad(loadAudit, null);
export const useStellicProfile = (): Loadable<StellicProfile | null> => useLoad(loadProfile, null);
export const usePlanReview = (): Loadable<PlanReview | null> => useLoad(loadReview, null);
