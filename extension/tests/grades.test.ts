import { describe, expect, it } from 'bun:test';
import type { RawAssignmentGroup } from '@/services/canvas/canvas-types';
import { summariseGroups } from '@/services/canvas/grades';

// Group percents are computed the way Canvas computes a current score: graded work only, with
// excused, omitted and zero-point work left out. A wrong rule here shows a student a wrong grade.

const group = (assignments: RawAssignmentGroup['assignments'], weight = 40): RawAssignmentGroup => ({ id: 1, name: 'Homework', group_weight: weight, assignments });

describe('summariseGroups', () => {
    it('averages by points over graded work only', () => {
        const [g] = summariseGroups(
            [
                group([
                    { id: 1, points_possible: 10, submission: { score: 9 } },
                    { id: 2, points_possible: 30, submission: { score: 24 } },
                    { id: 3, points_possible: 10, submission: { score: null } },
                ]),
            ],
            true,
        );
        expect(g).toEqual({ id: '1', name: 'Homework', weight: 40, percent: 82.5, graded: 2, total: 3 });
    });

    it('leaves out excused, omitted and zero-point work', () => {
        const [g] = summariseGroups(
            [
                group([
                    { id: 1, points_possible: 10, submission: { score: 10 } },
                    { id: 2, points_possible: 10, submission: { score: 0, excused: true } },
                    { id: 3, points_possible: 10, omit_from_final_grade: true, submission: { score: 0 } },
                    { id: 4, points_possible: 0, submission: { score: 5 } },
                ]),
            ],
            true,
        );
        expect(g?.percent).toBe(100);
        expect(g?.graded).toBe(1);
    });

    it('reports no percent when nothing is graded, and no weight when the course is unweighted', () => {
        const [g] = summariseGroups([group([{ id: 1, points_possible: 10 }])], false);
        expect(g?.percent).toBeNull();
        expect(g?.weight).toBeNull();
    });
});
