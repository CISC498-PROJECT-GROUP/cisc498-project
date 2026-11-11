// Laying sections out on a weekly grid: one block per meeting per day, side by side where they
// overlap (each block gets a lane within its cluster of overlapping blocks), the days shown (Monday to
// Friday, plus Saturday or Sunday only when something meets then) and the hours (8am–10pm, widened to
// fit anything earlier or later). Pure.

import { meetingsOverlap } from '@/services/webreg/conflicts';
import { DAYS, toMinutes } from '@/services/webreg/times';
import type { Day, Meeting, PlannedAdd, RegisteredSection } from '@/services/types/webreg';

export type BlockKind = 'registered' | 'dropping' | 'planned' | 'preview';

export interface CalendarItem {
    id: string;
    code: string;
    title: string;
    kind: BlockKind;
    meetings: Meeting[];
}

export interface Block {
    key: string;
    item: CalendarItem;
    meeting: Meeting;
    day: Day;
    /** Minutes after midnight. */
    start: number;
    end: number;
    lane: number;
    lanes: number;
    conflict: boolean;
}

export interface CalendarLayout {
    days: Day[];
    startHour: number;
    endHour: number;
    blocks: Block[];
}

const WEEKDAYS: Day[] = ['M', 'T', 'W', 'R', 'F'];

function laneDay(blocks: Block[]): void {
    blocks.sort((a, b) => a.start - b.start || b.end - a.end);
    let cluster: Block[] = [];
    let clusterEnd = -1;
    const close = () => cluster.forEach((b) => (b.lanes = Math.max(...cluster.map((c) => c.lane)) + 1));
    for (const block of blocks) {
        if (block.start >= clusterEnd) {
            close();
            cluster = [];
            clusterEnd = -1;
        }
        const used = new Set(cluster.filter((c) => c.end > block.start).map((c) => c.lane));
        let lane = 0;
        while (used.has(lane)) lane++;
        block.lane = lane;
        cluster.push(block);
        clusterEnd = Math.max(clusterEnd, block.end);
    }
    close();
}

/** Blocks that overlap a block of another section, both being ones that would be on the schedule. */
function markConflicts(blocks: Block[]): void {
    const live = blocks.filter((b) => b.item.kind !== 'dropping');
    for (const a of live) a.conflict = live.some((b) => b.item.id !== a.item.id && b.day === a.day && meetingsOverlap(a.meeting, b.meeting));
}

export function layoutWeek(items: CalendarItem[]): CalendarLayout {
    const blocks: Block[] = [];
    for (const item of items)
        item.meetings.forEach((meeting, m) => {
            for (const day of meeting.days) blocks.push({ key: `${item.kind}-${item.id}-${m}-${day}`, item, meeting, day, start: toMinutes(meeting.start), end: toMinutes(meeting.end), lane: 0, lanes: 1, conflict: false });
        });
    const used = new Set(blocks.map((b) => b.day));
    const days = DAYS.filter((d) => WEEKDAYS.includes(d) || used.has(d));
    for (const day of days) laneDay(blocks.filter((b) => b.day === day));
    markConflicts(blocks);
    const startHour = Math.min(8, ...blocks.map((b) => Math.floor(b.start / 60)));
    const endHour = Math.max(22, ...blocks.map((b) => Math.ceil(b.end / 60)));
    return { days, startHour, endHour, blocks };
}

/** What the week shows: registered sections (those a plan gives up as dropping), the plan's adds, and
    the section being previewed from search. */
export function calendarItems(registered: RegisteredSection[], adds: PlannedAdd[], leaving: Set<string>, preview: CalendarItem | null): CalendarItem[] {
    const items: CalendarItem[] = registered.map((s) => ({ id: s.id, code: s.code, title: s.title, kind: leaving.has(s.id) ? 'dropping' : 'registered', meetings: s.meetings }));
    for (const add of adds) for (const s of add.sections) items.push({ id: s.id, code: s.code, title: s.title, kind: 'planned', meetings: s.meetings });
    if (preview && !items.some((i) => i.id === preview.id)) items.push({ ...preview, kind: 'preview' });
    return items;
}
