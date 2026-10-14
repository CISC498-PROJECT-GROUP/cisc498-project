// One course's grade: course code (in the course colour) and name, current score and letter, and a
// progress meter; opens to show each assignment group.

import { Icon } from '@/components/common/icon';
import { GradeGroups } from '@/components/grades/grade-groups';
import type { Course } from '@/services/types';

interface GradeCardProps {
    course: Course;
    expanded: boolean;
    onToggle: () => void;
}

export function GradeCard({ course, expanded, onToggle }: GradeCardProps) {
    const panel_id = `ca-grade-${course.id}`;
    return (
        <div class={`ca-grade ${expanded ? 'ca-grade--open' : ''}`} style={{ '--ca-course': course.color }}>
            <button type="button" class="ca-grade-head" onClick={onToggle} aria-expanded={expanded} aria-controls={panel_id}>
                <span class="ca-grade-top">
                    <span class="ca-grade-name">
                        <span class="ca-grade-code">{course.code}</span>
                        <span class="ca-grade-title">{course.name}</span>
                    </span>
                    <span class="ca-grade-pct">{course.percent === null ? '—' : `${course.percent.toFixed(1)}%`}</span>
                    {course.letter && <span class="ca-grade-letter">{course.letter}</span>}
                    <span class={`ca-chevron ${expanded ? 'ca-chevron--open' : ''}`}>
                        <Icon name="chevron" size={16} />
                    </span>
                </span>
                <span class="ca-meter" aria-hidden="true">
                    <span class="ca-meter-fill" style={{ width: `${Math.min(course.percent ?? 0, 100)}%` }} />
                </span>
            </button>
            {expanded && <GradeGroups id={panel_id} course={course} />}
        </div>
    );
}
