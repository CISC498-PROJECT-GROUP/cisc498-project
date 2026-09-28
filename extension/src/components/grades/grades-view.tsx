// Current grade in every course, each expandable into its assignment groups.

import { useState } from 'preact/hooks';
import { LoadState } from '@/components/common/load-state';
import { GradeCard } from '@/components/grades/grade-card';
import { useCourses } from '@/services/hooks/use-courses';

export function GradesView({ onAsk }: { onAsk: (question: string) => void }) {
    const courses = useCourses();
    const [expanded, setExpanded] = useState<string | null>(null);
    const ready = !courses.loading && !courses.error;

    return (
        <div class="ca-body">
            <div class="ca-toolbar">
                <span class="ca-toolbar-title">{ready ? `${courses.data.length} courses` : 'Courses'}</span>
                <span class="ca-toolbar-hint">Current scores · tap for breakdown</span>
            </div>
            <LoadState state={courses} rows={4} />
            <div class="ca-stack">
                {courses.data.map((course) => (
                    <GradeCard key={course.id} course={course} expanded={expanded === course.id} onToggle={() => setExpanded(expanded === course.id ? null : course.id)} />
                ))}
            </div>
            {ready && courses.data.length > 0 && (
                <button type="button" class="ca-ask-row" onClick={() => onAsk('What do I need on my remaining work and finals to keep or raise my current grades?')}>
                    What do I need on my finals? →
                </button>
            )}
        </div>
    );
}
