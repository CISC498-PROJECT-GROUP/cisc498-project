// The student's Stellic plan as a list of terms. Stellic files terms by season (sem_content[].id —
// 1 fall, 2 winter, 3 spring, 4 summer, which the term dates confirm: Aug–Dec, Jan–Feb, Feb–May,
// Jun–Aug) and then by plan year; physical_year is the calendar year the term runs in.
//
// Pure: `now` decides which term is current, so the mapping tests without a clock.

import { isoDay } from '@/services/format/dates';
import type { RawPlanCourse, RawSemesterContent, RawStudentPlan } from '@/services/stellic/stellic-types';
import type { PlanCourse, Season, StellicPlan, Term } from '@/services/types/stellic';

const SEASONS: Record<number, Season> = { 1: 'Fall', 2: 'Winter', 3: 'Spring', 4: 'Summer' };
const SEASON_ORDER: Record<Season, number> = { Winter: 0, Spring: 1, Summer: 2, Fall: 3 };

export const mapPlanCourse = (raw: RawPlanCourse): PlanCourse => {
    const grade = raw.grade?.trim() || null;
    const status = grade ? 'completed' : raw.is_registered ? 'enrolled' : 'planned';
    return {
        code: raw.code?.trim() ?? 'Course',
        name: raw.name?.trim() ?? raw.code ?? 'Course',
        credits: raw.units ?? 0,
        grade,
        status,
        statusLabel: status === 'completed' ? null : (raw.registration_status?.screen_name ?? null),
    };
};

/** Where `now` falls against the term's dates; Stellic's own is_past when the dates are missing. */
export const termWhen = (raw: RawSemesterContent, now: Date): Term['when'] => {
    const start = raw.semester_dates?.start_date;
    const end = raw.semester_dates?.end_date;
    if (!start || !end) return raw.is_past ? 'past' : 'future';
    const today = isoDay(now);
    if (today > end) return 'past';
    if (today < start) return 'future';
    return 'current';
};

const termKey = (t: Term): number => t.year * 10 + SEASON_ORDER[t.season];

export function mapPlan(raw: RawStudentPlan, now: Date): StellicPlan {
    const plan = raw.student_plan ?? {};
    const terms: Term[] = [];
    for (const season of plan.sem_content ?? []) {
        const name = SEASONS[season.id];
        if (!name) continue;
        for (const content of Object.values(season.content ?? {})) {
            const courses = (content.courses ?? []).map(mapPlanCourse);
            if (courses.length === 0 || !content.physical_year) continue;
            terms.push({
                label: `${name} ${content.physical_year}`,
                season: name,
                year: content.physical_year,
                start: content.semester_dates?.start_date ?? null,
                end: content.semester_dates?.end_date ?? null,
                when: termWhen(content, now),
                courses,
            });
        }
    }
    terms.sort((a, b) => termKey(a) - termKey(b));
    return { planId: plan.plan_id ?? '', programs: (plan.programs ?? []).map((p) => p.name ?? p.short_name ?? '').filter(Boolean), terms };
}

/** The term in session, or failing that the next one coming. */
export const currentTerm = (plan: StellicPlan): Term | null => plan.terms.find((t) => t.when === 'current') ?? plan.terms.find((t) => t.when === 'future') ?? null;

/** The first term after the current one. */
export const nextTerm = (plan: StellicPlan): Term | null => {
    const now = currentTerm(plan);
    return plan.terms.find((t) => t.when === 'future' && t !== now) ?? null;
};

export const seasonName = (id: number | undefined): Season | null => (id === undefined ? null : (SEASONS[id] ?? null));
