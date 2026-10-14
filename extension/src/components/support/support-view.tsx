// Where to get help: a card per course with its instructors (and a one-tap question for office
// hours, which usually live in the syllabus), then Canvas's own help, then a way into the chat.

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

interface SupportViewProps {
    onAsk: (question: string) => void;
    onOpenChat: () => void;
}

export function SupportView({ onAsk, onOpenChat }: SupportViewProps) {
    const courses = useCourses();

    return (
        <div class="ca-body ca-body--tight">
            <section class="ca-section">
                <h3 class="ca-section-label">Your instructors</h3>
                <LoadState state={courses} rows={4} />
                {courses.data.map((course) => (
                    <div key={course.id} class="ca-person" style={{ '--ca-course': course.color }}>
                        <div class="ca-person-head">
                            <span class="ca-initials" aria-hidden="true">
                                {initials(course.teachers[0]?.name ?? course.code)}
                            </span>
                            <span class="ca-person-names">
                                {course.teachers.length === 0 && <span class="ca-person-name">No instructor listed</span>}
                                {course.teachers.map((t) => (
                                    <a key={t.id} class="ca-person-name" href={t.url} target="_blank" rel="noopener noreferrer">
                                        {t.name}
                                    </a>
                                ))}
                            </span>
                            <button type="button" class="ca-chip" onClick={() => onAsk(`When and where are office hours for ${course.code}?`)} title="Ask the assistant">
                                <Icon name="sparkle" size={11} />
                                Office hours
                            </button>
                        </div>
                        <span class="ca-person-course">
                            {course.code} · {course.name}
                        </span>
                    </div>
                ))}
            </section>

            <section class="ca-section">
                <h3 class="ca-section-label">Canvas help</h3>
                <div class="ca-link-card">
                    <HelpLink href="https://community.canvaslms.com/t5/Student-Guide/tkb-p/student" icon="book" label="Canvas Student Guide" description="Step-by-step how-tos" />
                    <HelpLink href="https://status.instructure.com/" icon="pulse" label="Canvas status" description="Is Canvas having an outage?" />
                </div>
            </section>

            <button type="button" class="ca-more-help" onClick={onOpenChat}>
                <span>Can’t find what you need?</span>
                <span class="ca-more-help-go">Ask Assistant →</span>
            </button>
        </div>
    );
}
