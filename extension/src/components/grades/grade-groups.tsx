// The expanded part of a grade card: each assignment group with its weight and the student's
// percent in it. Fetched when the card opens.

import { LoadState } from '@/components/common/load-state';
import { useGradeGroups } from '@/services/hooks/use-grade-groups';
import type { Course } from '@/services/types';

export function GradeGroups({ id, course }: { id: string; course: Course }) {
    const groups = useGradeGroups(course.id);

    return (
        <div id={id} class="ca-grade-cats">
            <LoadState state={groups} label="the breakdown" />
            {!groups.loading && !groups.error && groups.data.length === 0 && <p class="ca-empty">No graded work yet.</p>}
            {groups.data.map((group) => (
                <div key={group.id} class="ca-cat">
                    <div class="ca-cat-head">
                        <span>
                            <span class="ca-strong">{group.name}</span>
                            {group.weight !== null && <span class="ca-muted"> · {group.weight}%</span>}
                        </span>
                        <span class="ca-strong">{group.percent === null ? 'Not graded' : `${group.percent}%`}</span>
                    </div>
                    <div class="ca-bar">
                        <div class="ca-bar-fill" style={{ width: `${Math.min(group.percent ?? 0, 100)}%` }} />
                    </div>
                </div>
            ))}
            <a class="ca-card-link" href={`${course.url}/grades`} target="_blank" rel="noopener noreferrer">
                Open grades in Canvas
            </a>
        </div>
    );
}
