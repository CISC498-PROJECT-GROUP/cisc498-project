// Courses (#/courses): a card per active Canvas course with its current grade and the breakdown by
// assignment group, and a question for the assistant about what the finals need to be.

import { Icon } from '@/components/common/icon';
import { LoadState } from '@/components/common/load-state';
import { GradeCard } from '@/components/grades/grade-card';
import { PageHead } from '@/components/shell/page-head';
import { useCourses } from '@/services/hooks/use-courses';

export function CoursesPage({ onAsk }: { onAsk: (question: string) => void }) {
    const courses = useCourses();
    const ready = !courses.loading && !courses.error;
    const term = courses.data.find((c) => c.term)?.term;

    return (
        <>
            <PageHead
                kicker={term ?? 'Canvas'}
                title="Courses"
                sub={ready ? `${courses.data.length} active ${courses.data.length === 1 ? 'course' : 'courses'} · current scores from Canvas` : 'Current scores from Canvas'}
                actions={
                    ready &&
                    courses.data.length > 0 && (
                        <button type="button" class="ca-btn ca-btn--primary" onClick={() => onAsk('What do I need on my remaining work and finals to keep or raise my current grades?')}>
                            <Icon name="sparkle" size={15} />
                            What do I need on my finals?
                        </button>
                    )
                }
            />
            <LoadState state={courses} rows={4} />
            {ready && courses.data.length === 0 && <p class="ca-empty-line">Canvas lists no active courses for you.</p>}
            <div class="ca-course-grid">
                {courses.data.map((course) => (
                    <GradeCard key={course.id} course={course} />
                ))}
            </div>
        </>
    );
}
