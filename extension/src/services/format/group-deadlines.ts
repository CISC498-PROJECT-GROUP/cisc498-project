// Groups deadlines under day headings for the deadlines view. Pure, so it tests without a clock.
//
// "To do" hides finished work but keeps anything overdue and unsubmitted — collected under one
// "Overdue" heading at the top, since that is the first thing a student needs to see.

import { dayLabel } from '@/services/format/dates';
import type { Deadline } from '@/services/types';

export interface DayGroup {
    label: string;
    overdue: boolean;
    items: Deadline[];
}

export type DeadlineFilter = 'todo' | 'all';

export function groupDeadlines(deadlines: Deadline[], now: Date, filter: DeadlineFilter): DayGroup[] {
    const groups: DayGroup[] = [];
    const overdue: Deadline[] = [];
    for (const d of deadlines) {
        const past = d.dueAt.getTime() < now.getTime();
        if (filter === 'todo' && d.submitted) continue;
        if (past && !d.submitted) {
            overdue.push(d);
            continue;
        }
        if (past && filter === 'todo') continue;
        const label = dayLabel(d.dueAt, now);
        const last = groups[groups.length - 1];
        if (last?.label === label) last.items.push(d);
        else groups.push({ label, overdue: false, items: [d] });
    }
    return overdue.length > 0 ? [{ label: 'Overdue', overdue: true, items: overdue }, ...groups] : groups;
}

/** The home screen's at-a-glance numbers. */
export function glance(deadlines: Deadline[], now: Date): { dueSoon: number; overdue: number } {
    const soon = now.getTime() + 48 * 60 * 60 * 1000;
    return { dueSoon: deadlines.filter((d) => !d.submitted && d.dueAt.getTime() >= now.getTime() && d.dueAt.getTime() <= soon).length, overdue: deadlines.filter((d) => !d.submitted && d.dueAt.getTime() < now.getTime()).length };
}
