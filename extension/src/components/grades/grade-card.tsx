// One course's grade: a summary row that toggles open to show each assignment group as a bar.

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
        <div class="ca-card" style={{ '--ca-course': course.color }}>
            <button type="button" class="ca-grade-row" onClick={onToggle} aria-expanded={expanded} aria-controls={panel_id}>
                <span class="ca-stripe" aria-hidden="true" />
                <span class="ca-grade-name">
                    <span class="ca-strong">{course.code}</span>
                    <span class="ca-muted">{course.name}</span>
                </span>
                <span class="ca-grade-score">
                    <span class="ca-grade-pct">{course.percent === null ? '—' : `${course.percent.toFixed(1)}%`}</span>
                    {course.letter && <span class="ca-grade-letter">{course.letter}</span>}
                </span>
                <span class={`ca-chevron ${expanded ? 'ca-chevron--open' : ''}`}>
                    <Icon name="chevron" size={16} />
                </span>
            </button>
            {expanded && <GradeGroups id={panel_id} course={course} />}
        </div>
    );
}
