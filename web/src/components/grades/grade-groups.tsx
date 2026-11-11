// A course's assignment groups: each with its weight and the student's percent in it, as Canvas
// reports them. Loaded per course, alongside the card.

import { LoadState } from '@/components/common/load-state';
import { useGradeGroups } from '@/services/hooks/use-grade-groups';
import type { Course } from '@/services/types';

export function GradeGroups({ course }: { course: Course }) {
    const groups = useGradeGroups(course.id);

    return (
        <div class="ca-grade-body">
            <LoadState state={groups} rows={2} />
            {!groups.loading && !groups.error && groups.data.length === 0 && <p class="ca-empty-line">No graded work yet.</p>}
            {groups.data.length > 0 && (
                <ul class="ca-cat-list">
                    {groups.data.map((group) => (
                        <li key={group.id} class="ca-cat">
                            <span class="ca-cat-name">
                                {group.name}
                                {group.weight !== null && <span class="ca-cat-weight">{group.weight}%</span>}
                            </span>
                            <span class={group.percent === null ? 'ca-cat-score ca-faint' : 'ca-cat-score'}>{group.percent === null ? 'Not graded' : `${group.percent}%`}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
