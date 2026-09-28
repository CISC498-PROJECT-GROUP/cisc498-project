// Current grade in every course, each expandable into its assignment groups.

import { useState } from 'preact/hooks';
import { LoadState } from '@/components/common/load-state';
import { GradeCard } from '@/components/grades/grade-card';
import { useCourses } from '@/services/hooks/use-courses';

export function GradesView({ onAsk }: { onAsk: (question: string) => void }) {
    const courses = useCourses();
    const [expanded, setExpanded] = useState<string | null>(null);

    return (
        <div class="ca-body ca-list">
            <LoadState state={courses} label="your grades" />
            {!courses.loading && !courses.error && (
                <div class="ca-list-head">
                    <span class="ca-muted">{courses.data.length} courses · tap one for details</span>
                </div>
            )}
            {courses.data.map((course) => (
                <GradeCard key={course.id} course={course} expanded={expanded === course.id} onToggle={() => setExpanded(expanded === course.id ? null : course.id)} />
            ))}
            {courses.data.length > 0 && (
                <button type="button" class="ca-outline-btn" onClick={() => onAsk('What do I need on my remaining work and finals to keep or raise my current grades?')}>
                    Ask what I need on my finals
                </button>
            )}
        </div>
    );
}
