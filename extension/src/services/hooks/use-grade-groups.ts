// One course's grade by assignment group — loaded when its card is opened, not before.

import { fetchAssignmentGroups, summariseGroups } from '@/services/canvas/grades';
import { useLoad } from '@/services/hooks/use-load';
import type { GradeGroup, Loadable } from '@/services/types';

async function load(courseId: string): Promise<GradeGroup[]> {
    const groups = await fetchAssignmentGroups(courseId);
    return summariseGroups(
        groups,
        groups.some((g) => (g.group_weight ?? 0) > 0),
    );
}

export const useGradeGroups = (courseId: string): Loadable<GradeGroup[]> => useLoad(() => load(courseId), [], courseId);
