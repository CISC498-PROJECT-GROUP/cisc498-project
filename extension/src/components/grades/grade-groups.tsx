// The open part of a grade card: each assignment group with its weight and the student's percent in
// it. Fetched when the card opens.

import { Icon } from '@/components/common/icon';
import { LoadState } from '@/components/common/load-state';
import { useGradeGroups } from '@/services/hooks/use-grade-groups';
import type { Course } from '@/services/types';

export function GradeGroups({ id, course }: { id: string; course: Course }) {
    const groups = useGradeGroups(course.id);

    return (
        <div id={id} class="ca-grade-body">
            <LoadState state={groups} rows={2} />
            {!groups.loading && !groups.error && groups.data.length === 0 && <p class="ca-muted ca-small">No graded work yet.</p>}
            {groups.data.map((group) => (
                <div key={group.id} class="ca-cat">
                    <span class="ca-cat-name">
                        {group.name}
                        {group.weight !== null && <span class="ca-cat-weight">{group.weight}%</span>}
                    </span>
                    <span class={group.percent === null ? 'ca-cat-score ca-muted' : 'ca-cat-score'}>{group.percent === null ? 'Not graded' : `${group.percent}%`}</span>
                </div>
            ))}
            <a class="ca-link" href={`${course.url}/grades`} target="_blank" rel="noopener noreferrer">
                Open in Canvas
                <Icon name="external" size={12} />
            </a>
        </div>
    );
}
