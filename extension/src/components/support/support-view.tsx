// Where to get help: Canvas's own guides, and who teaches each course — with a one-tap question
// to the assistant for office hours, which usually live in the syllabus.

import { LoadState } from '@/components/common/load-state';
import { HelpLink } from '@/components/support/help-link';
import { useCourses } from '@/services/hooks/use-courses';

export function SupportView({ onAsk }: { onAsk: (question: string) => void }) {
    const courses = useCourses();

    return (
        <div class="ca-body ca-list">
            <h3 class="ca-section">Get help with Canvas</h3>
            <HelpLink href="https://community.canvaslms.com/t5/Student-Guide/tkb-p/student" icon="book" label="Canvas Student Guide" description="Step-by-step how-tos" />
            <HelpLink href="https://status.instructure.com/" icon="pulse" label="Canvas status" description="Check whether Canvas is having an outage" />

            <div class="ca-list-head ca-list-head--spaced">
                <h3 class="ca-section">Your instructors</h3>
            </div>
            <LoadState state={courses} label="your instructors" />
            {courses.data.map((course) => (
                <div key={course.id} class="ca-card ca-teacher" style={{ '--ca-course': course.color }}>
                    <span class="ca-stripe" aria-hidden="true" />
                    <span class="ca-menu-text">
                        <span class="ca-muted ca-small">
                            {course.code} · {course.name}
                        </span>
                        {course.teachers.length === 0 && <span class="ca-muted">No instructor listed</span>}
                        {course.teachers.map((t) => (
                            <a key={t.id} class="ca-strong ca-teacher-name" href={t.url} target="_blank" rel="noopener noreferrer">
                                {t.name}
                            </a>
                        ))}
                    </span>
                    <button type="button" class="ca-chip ca-chip--sm" onClick={() => onAsk(`When and where are office hours for ${course.code}?`)}>
                        Office hours?
                    </button>
                </div>
            ))}
        </div>
    );
}
