// One course's card on the Courses page: code (in the course colour), name and instructor, the
// current score and letter with a meter, then the breakdown by assignment group, and links into
// the course in Canvas.

import { Icon } from '@/components/common/icon';
import { GradeGroups } from '@/components/grades/grade-groups';
import type { Course } from '@/services/types';

export function GradeCard({ course }: { course: Course }) {
    const teachers = course.teachers.map((t) => t.name).join(', ');
    return (
        <article class="ca-grade" style={{ '--ca-course': course.color }} aria-label={`${course.code} ${course.name}`}>
            <header class="ca-grade-head">
                <div class="ca-grade-name">
                    <span class="ca-grade-code">{course.code}</span>
                    <h2 class="ca-grade-title">{course.name}</h2>
                    {teachers && <span class="ca-grade-teacher">{teachers}</span>}
                </div>
                <div class="ca-grade-score">
                    <span class="ca-grade-pct">{course.percent === null ? '—' : `${course.percent.toFixed(1)}%`}</span>
                    <span class="ca-grade-letter">{course.letter ?? (course.percent === null ? 'No grade yet' : '')}</span>
                </div>
            </header>
            <span class="ca-meter" aria-hidden="true">
                <span class="ca-meter-fill" style={{ width: `${Math.min(course.percent ?? 0, 100)}%` }} />
            </span>
            <GradeGroups course={course} />
            <footer class="ca-grade-links">
                <a class="ca-link" href={course.url} target="_blank" rel="noopener noreferrer">
                    Course home
                    <Icon name="external" size={12} />
                </a>
                <a class="ca-link" href={`${course.url}/grades`} target="_blank" rel="noopener noreferrer">
                    Grades in Canvas
                    <Icon name="external" size={12} />
                </a>
            </footer>
        </article>
    );
}
