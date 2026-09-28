// Where to get help: each course's instructors (with a one-tap question for office hours, which
// usually live in the syllabus), then Canvas's own help.

import { Icon } from '@/components/common/icon';
import { LoadState } from '@/components/common/load-state';
import { HelpLink } from '@/components/support/help-link';
import { useCourses } from '@/services/hooks/use-courses';

const initials = (name: string): string =>
    name
        .replace(/^(Dr|Prof|Professor|Mr|Ms|Mrs)\.?\s+/i, '')
        .split(/\s+/)
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

export function SupportView({ onAsk }: { onAsk: (question: string) => void }) {
    const courses = useCourses();

    return (
        <div class="ca-body">
            <h3 class="ca-group-label">Your instructors</h3>
            <LoadState state={courses} rows={4} />
            <div class="ca-list-card">
                {courses.data.map((course) => (
                    <div key={course.id} class="ca-row" style={{ '--ca-course': course.color }}>
                        <span class="ca-initials" aria-hidden="true">
                            {initials(course.teachers[0]?.name ?? course.code)}
                        </span>
                        <span class="ca-row-main">
                            {course.teachers.length === 0 && <span class="ca-row-title">No instructor listed</span>}
                            {course.teachers.map((t) => (
                                <a key={t.id} class="ca-row-title ca-row-link" href={t.url} target="_blank" rel="noopener noreferrer">
                                    {t.name}
                                </a>
                            ))}
                            <span class="ca-row-meta">
                                {course.code} · {course.name}
                            </span>
                        </span>
                        <button type="button" class="ca-chip" onClick={() => onAsk(`When and where are office hours for ${course.code}?`)} title="Ask the assistant">
                            <Icon name="sparkle" size={12} />
                            Office hours
                        </button>
                    </div>
                ))}
            </div>

            <h3 class="ca-group-label">Canvas help</h3>
            <div class="ca-list-card">
                <HelpLink href="https://community.canvaslms.com/t5/Student-Guide/tkb-p/student" icon="book" label="Canvas Student Guide" description="Step-by-step how-tos" />
                <HelpLink href="https://status.instructure.com/" icon="pulse" label="Canvas status" description="Is Canvas having an outage?" />
            </div>
        </div>
    );
}
