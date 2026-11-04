/* View-models for what the dashboard shows from Stellic, mapped by services/stellic/*. Every value
   is Stellic's own — nothing here is computed beyond adding up what Stellic reports. */

export type Season = 'Fall' | 'Winter' | 'Spring' | 'Summer';

/** Where a course stands in the plan: earned (graded or credited), enrolled now, or only planned. */
export type PlanCourseStatus = 'completed' | 'enrolled' | 'planned';

export interface PlanCourse {
    /** "CISC 304" — Stellic's code, and the key that joins a Stellic course to a Canvas one. */
    code: string;
    name: string;
    credits: number;
    grade: string | null;
    status: PlanCourseStatus;
    /** Stellic's own label for the registration state ("Enrolled"), when it gives one. */
    statusLabel: string | null;
}

export interface Term {
    /** "Fall 2026" — Stellic's season with the calendar year the term runs in. */
    label: string;
    season: Season;
    year: number;
    start: string | null;
    end: string | null;
    when: 'past' | 'current' | 'future';
    courses: PlanCourse[];
}

export interface StellicPlan {
    planId: string;
    programs: string[];
    /** Every term that has courses in it, oldest first. */
    terms: Term[];
}

export interface CreditSummary {
    taken: number;
    inProgress: number;
    /** Planned in Stellic for a later term, not yet taken or registered. */
    planned: number;
    remaining: number;
}

/** Stellic's `satisfied` counts planned courses too, so "satisfied" alone can mean "only on paper":
    complete — nothing pending · in-progress — satisfied once this term ends · planned — satisfied only
    with courses still to take · open — Stellic says not satisfied. */
export type ProgramStatus = 'complete' | 'in-progress' | 'planned' | 'open';

export interface OpenRequirement {
    name: string;
    /** How many more of it the audit wants (a requirement can be needed twice). */
    count: number;
    credits: number;
}

export interface ProgramProgress {
    id: string;
    name: string;
    satisfied: boolean;
    status: ProgramStatus;
    credits: CreditSummary;
    open: OpenRequirement[];
}

export interface DegreeAudit {
    gpa: number | null;
    pathway: string | null;
    programs: ProgramProgress[];
    /** When Stellic last ran the audit, as it reports it. */
    computedAt: string | null;
}

export interface Advisor {
    name: string;
    email: string | null;
}

export interface StellicProfile {
    name: string;
    standing: string | null;
    school: string | null;
    graduation: string | null;
    advisors: Advisor[];
}

export interface PlanReview {
    reviewed: boolean;
    openWith: string | null;
    openSince: string | null;
}
