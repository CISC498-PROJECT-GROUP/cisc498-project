// Time conflicts between sections: two meetings clash when they share a day, their times overlap
// (back-to-back is fine — 10:10 ending and 10:10 starting do not clash), and their date ranges overlap
// when both have one (two 7-week halves of a term never clash). An online section never conflicts.
// Pure — WebReg makes the final call when the student registers; this is the warning before that.

import { dayNumber, toMinutes } from '@/services/webreg/times';
import type { Meeting } from '@/services/types/webreg';

function datesOverlap(a: Meeting, b: Meeting): boolean {
    const [as, ae, bs, be] = [dayNumber(a.startDate), dayNumber(a.endDate), dayNumber(b.startDate), dayNumber(b.endDate)];
    if (as === null || ae === null || bs === null || be === null) return true;
    return as <= be && bs <= ae;
}

export function meetingsOverlap(a: Meeting, b: Meeting): boolean {
    if (!a.days.some((d) => b.days.includes(d))) return false;
    if (!(toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end))) return false;
    return datesOverlap(a, b);
}

export const sectionsOverlap = (a: Meeting[], b: Meeting[]): boolean => a.some((x) => b.some((y) => meetingsOverlap(x, y)));

export interface Timed {
    id: string;
    meetings: Meeting[];
}

/** For each id, the ids it conflicts with. Ids without a conflict are absent. */
export function findConflicts(items: Timed[]): Map<string, string[]> {
    const out = new Map<string, string[]>();
    const add = (from: string, to: string) => out.set(from, [...(out.get(from) ?? []), to]);
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            if (items[i].id === items[j].id || !sectionsOverlap(items[i].meetings, items[j].meetings)) continue;
            add(items[i].id, items[j].id);
            add(items[j].id, items[i].id);
        }
    }
    return out;
}

/** The ids in `items` that `candidate` would clash with. */
export const conflictsWith = (candidate: Meeting[], items: Timed[]): string[] => items.filter((item) => sectionsOverlap(candidate, item.meetings)).map((item) => item.id);
