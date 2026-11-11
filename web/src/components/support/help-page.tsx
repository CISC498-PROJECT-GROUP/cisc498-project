// Help (#/help): who teaches each course (with a one-tap question for office hours, which usually
// live in the syllabus), the UD systems this site reads, Canvas's own help, and a way into the chat.

import { Icon } from '@/components/common/icon';
import { LoadState } from '@/components/common/load-state';
import { PageHead } from '@/components/shell/page-head';
import { HelpLink } from '@/components/support/help-link';
import { useCourses } from '@/services/hooks/use-courses';
import { CANVAS_ORIGIN, STELLIC_ORIGIN, WEBREG_ORIGIN } from '@/services/school';

const initials = (name: string): string =>
    name
        .replace(/^(Dr|Prof|Professor|Mr|Ms|Mrs)\.?\s+/i, '')
        .split(/\s+/)
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

export function HelpPage({ onAsk }: { onAsk: (question: string) => void }) {
    const courses = useCourses();

    return (
        <>
            <PageHead title="Help & instructors" sub="Who to ask about each course, and where to go when something isn't working." />
            <div class="ca-help-grid">
                <section class="ca-section">
                    <h2 class="ca-section-label">Your instructors</h2>
                    <LoadState state={courses} rows={4} />
                    <div class="ca-people">
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
                                        <span class="ca-person-course">
                                            {course.code} · {course.name}
                                        </span>
                                    </span>
                                    <button type="button" class="ca-chip ca-chip--lg" onClick={() => onAsk(`When and where are office hours for ${course.code}?`)} title="Ask the assistant">
                                        <Icon name="sparkle" size={12} />
                                        Office hours
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div class="ca-help-side">
                    <section class="ca-section">
                        <h2 class="ca-section-label">Your UD systems</h2>
                        <div class="ca-link-card">
                            <HelpLink href={`${CANVAS_ORIGIN}/`} icon="book" label="Canvas" description="Courses, assignments and grades" />
                            <HelpLink href={`${STELLIC_ORIGIN}/app/planner`} icon="cap" label="Stellic" description="Your degree plan and audit" />
                            <HelpLink href={`${WEBREG_ORIGIN}/`} icon="calendar" label="WebReg" description="Registration and your class schedule" />
                        </div>
                    </section>
                    <section class="ca-section">
                        <h2 class="ca-section-label">Canvas help</h2>
                        <div class="ca-link-card">
                            <HelpLink href="https://community.canvaslms.com/t5/Student-Guide/tkb-p/student" icon="doc" label="Canvas Student Guide" description="Step-by-step how-tos" />
                            <HelpLink href="https://status.instructure.com/" icon="pulse" label="Canvas status" description="Is Canvas having an outage?" />
                        </div>
                    </section>
                    <a class="ca-more-help" href="#/assistant">
                        <span>Can't find what you need?</span>
                        <span class="ca-more-help-go">Ask the assistant →</span>
                    </a>
                </div>
            </div>
        </>
    );
}
