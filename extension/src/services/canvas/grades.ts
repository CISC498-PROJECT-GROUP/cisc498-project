// A course's grade broken down by assignment group. The per-group percent is computed here the way
// Canvas computes a current score: graded work only, excused and omitted work left out.

import { canvasGetAll } from '@/services/canvas/canvas-api';
import type { RawAssignment, RawAssignmentGroup } from '@/services/canvas/canvas-types';
import type { GradeGroup } from '@/services/types';

/** Counts toward the current score: graded, not excused, not omitted, worth points. */
export const counts = (a: RawAssignment): boolean => !a.omit_from_final_grade && (a.points_possible ?? 0) > 0 && a.submission?.excused !== true && typeof a.submission?.score === 'number';

export function summariseGroups(groups: RawAssignmentGroup[], weighted: boolean): GradeGroup[] {
    return groups.map((group) => {
        const assignments = group.assignments ?? [];
        const graded = assignments.filter(counts);
        const earned = graded.reduce((sum, a) => sum + (a.submission?.score ?? 0), 0);
        const possible = graded.reduce((sum, a) => sum + (a.points_possible ?? 0), 0);
        return {
            id: String(group.id),
            name: group.name ?? 'Assignments',
            weight: weighted ? (group.group_weight ?? 0) : null,
            percent: possible > 0 ? Math.round((earned / possible) * 1000) / 10 : null,
            graded: graded.length,
            total: assignments.length,
        };
    });
}

export const fetchAssignmentGroups = (courseId: string): Promise<RawAssignmentGroup[]> => canvasGetAll<RawAssignmentGroup>(`/courses/${courseId}/assignment_groups`, { 'include[]': ['assignments', 'submission'] });
