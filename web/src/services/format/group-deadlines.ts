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

/** What the home screen leads with. `focus` is the one item to act on now — the oldest overdue
    work, or failing that the next thing due — and `soon` is the rest of what is due in 48 hours. */
export interface NextMove {
    overdue: Deadline[];
    focus: Deadline | null;
    soon: Deadline[];
}

export const SOON_HOURS = 48;

export function nextMove(deadlines: Deadline[], now: Date): NextMove {
    const open = deadlines.filter((d) => !d.submitted);
    const overdue = open.filter((d) => d.dueAt.getTime() < now.getTime());
    const upcoming = open.filter((d) => d.dueAt.getTime() >= now.getTime());
    const focus = overdue[0] ?? upcoming[0] ?? null;
    const cutoff = now.getTime() + SOON_HOURS * 60 * 60 * 1000;
    return { overdue, focus, soon: upcoming.filter((d) => d !== focus && d.dueAt.getTime() <= cutoff) };
}
