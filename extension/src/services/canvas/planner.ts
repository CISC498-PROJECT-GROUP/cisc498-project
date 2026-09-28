// Dated work across every course, from the student planner — the same feed as Canvas's own To Do
// list, including submission status.

import { absoluteUrl, canvasGetAll } from '@/services/canvas/canvas-api';
import type { RawPlannerItem } from '@/services/canvas/canvas-types';
import type { Deadline } from '@/services/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export const mapPlannerItem = (item: RawPlannerItem): Deadline | null => {
    const when = item.plannable?.due_at ?? item.plannable?.todo_date ?? item.plannable_date;
    if (!when) return null;
    const status = item.submissions === false ? undefined : item.submissions;
    return {
        id: `${item.plannable_type ?? 'item'}-${item.plannable_id}`,
        courseId: item.course_id == null ? null : String(item.course_id),
        courseName: item.context_name ?? null,
        title: item.plannable?.title ?? 'Untitled',
        dueAt: new Date(when),
        points: item.plannable?.points_possible ?? null,
        url: absoluteUrl(item.html_url),
        kind: item.plannable_type ?? 'item',
        submitted: status?.submitted === true || status?.excused === true,
        missing: status?.missing === true,
    };
};

/** Planner items dated between `daysBack` days ago and `daysAhead` days from now, soonest first. */
export async function fetchPlanner(daysAhead: number, daysBack = 0): Promise<Deadline[]> {
    const now = Date.now();
    const items = await canvasGetAll<RawPlannerItem>('/planner/items', { start_date: new Date(now - daysBack * DAY_MS).toISOString(), end_date: new Date(now + daysAhead * DAY_MS).toISOString() });
    return items
        .map(mapPlannerItem)
        .filter((d): d is Deadline => d !== null)
        .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
}
