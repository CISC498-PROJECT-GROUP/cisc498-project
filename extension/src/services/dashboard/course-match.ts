// Joins the two systems on the one thing they share: the course's subject and number. Stellic says
// "CISC 304"; a UD Canvas course code says "26F-CISC304-010" (term, subject+number, section). Both
// reduce to the key "CISC 304". A Canvas site with no such key (a club, an advising "course") simply
// matches nothing and is listed apart.
//
// Pure, so it tests without either system.

import type { Course, Deadline } from '@/services/types';
import type { PlanCourse, Term } from '@/services/types/stellic';

const KEY = /(?:^|[^A-Z])([A-Z]{2,5})[\s-]*(\d{3})(?!\d)/;

/** "CISC 304" from "CISC 304", "26F-CISC304-010", "cisc304"; null when there is no course number. */
export const courseKey = (text: string | null | undefined): string | null => {
    const match = KEY.exec((text ?? '').toUpperCase());
    return match ? `${match[1]} ${match[2]}` : null;
};

export interface TermCourse {
    plan: PlanCourse;
    canvas: Course | null;
    /** The next piece of open work from this course, if the planner has one. */
    next: Deadline | null;
    /** How many open items this course has in the window the deadlines cover. */
    openCount: number;
}

/** The Canvas course for a Stellic course; with several (a retake), the one tagged with the term's year. */
const pick = (matches: Course[], term: Term): Course | null => {
    if (matches.length <= 1) return matches[0] ?? null;
    const yy = String(term.year).slice(2);
    return matches.find((c) => (c.term ?? '').includes(String(term.year)) || c.code.startsWith(yy)) ?? matches[matches.length - 1]!;
};

export function joinTerm(term: Term, courses: Course[], deadlines: Deadline[], now: Date): TermCourse[] {
    return term.courses.map((plan) => {
        const key = courseKey(plan.code);
        const canvas = key ? pick(courses.filter((c) => courseKey(c.code) === key || courseKey(c.name) === key), term) : null;
        const open = canvas ? deadlines.filter((d) => d.courseId === canvas.id && !d.submitted && d.dueAt.getTime() >= now.getTime()) : [];
        return { plan, canvas, next: open[0] ?? null, openCount: open.length };
    });
}

/** Canvas sites that are not one of this term's courses — clubs, advising, last term's leftovers. */
export const otherCanvas = (rows: TermCourse[], courses: Course[]): Course[] => courses.filter((c) => !rows.some((r) => r.canvas?.id === c.id));
