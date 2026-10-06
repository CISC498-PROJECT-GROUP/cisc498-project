import { describe, expect, it } from 'bun:test';
import { mapPlannerItem } from '@/services/canvas/planner';

// Planner items vary by type: assignments carry due_at, to-dos carry todo_date, events only the
// plannable_date. Each must land on a real date with the right status.

(globalThis as { location?: unknown }).location ??= { origin: 'https://canvas.example.edu' };

describe('mapPlannerItem', () => {
    it('maps an assignment with its submission status and an absolute link', () => {
        const d = mapPlannerItem({
            course_id: 7,
            context_name: 'Data Structures',
            plannable_id: 42,
            plannable_type: 'assignment',
            html_url: '/courses/7/assignments/42',
            plannable: { title: 'HW 6', due_at: '2026-09-30T03:59:00Z', points_possible: 20 },
            submissions: { submitted: false, missing: true },
        });
        expect(d).toMatchObject({ id: 'assignment-42', courseId: '7', assignmentId: '42', title: 'HW 6', points: 20, submitted: false, missing: true, url: 'https://canvas.example.edu/courses/7/assignments/42' });
        expect(d?.dueAt.toISOString()).toBe('2026-09-30T03:59:00.000Z');
    });

    it('treats excused work as done, and falls back through the date fields', () => {
        const d = mapPlannerItem({ plannable_id: 1, plannable_type: 'planner_note', plannable_date: '2026-10-01T12:00:00Z', plannable: { title: 'Study' }, submissions: { excused: true } });
        expect(d?.submitted).toBe(true);
        expect(d?.courseId).toBeNull();
        expect(d?.assignmentId).toBeNull();
        expect(d?.dueAt.toISOString()).toBe('2026-10-01T12:00:00.000Z');
    });

    it('drops an item with no date at all', () => {
        expect(mapPlannerItem({ plannable_id: 1, plannable: { title: 'x' } })).toBeNull();
    });
});
