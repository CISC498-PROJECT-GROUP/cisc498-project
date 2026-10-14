// What a new chat shows: what the assistant can do, questions to start with — one tap sends — and
// how many of the student's Canvas courses it can read.

import { Icon, type IconName } from '@/components/common/icon';
import { useCourses } from '@/services/hooks/use-courses';

const STARTERS: { icon: IconName; text: string }[] = [
    { icon: 'calendar', text: "What's due this week?" },
    { icon: 'alert', text: 'Am I missing any assignments?' },
    { icon: 'grades', text: 'How am I doing in each class?' },
    { icon: 'doc', text: "What's the late policy in my courses?" },
];

export function EmptyChat({ onPick }: { onPick: (question: string) => void }) {
    const courses = useCourses();
    const count = courses.data.length;

    return (
        <div class="ca-empty-chat">
            <div class="ca-empty-intro">
                <span class="ca-avatar ca-avatar--lg" aria-hidden="true">
                    <Icon name="sparkle" size={28} />
                </span>
                <h3 class="ca-empty-title">Ask about your courses</h3>
                <p class="ca-empty-sub">I read your syllabi, assignments, grades and announcements — and find the syllabus even when it's buried in a PDF.</p>
            </div>
            <div class="ca-starters">
                {STARTERS.map((s) => (
                    <button key={s.text} type="button" class="ca-starter" onClick={() => onPick(s.text)}>
                        <Icon name={s.icon} size={17} />
                        <span>{s.text}</span>
                        <span class="ca-starter-go">
                            <Icon name="chevron" size={15} />
                        </span>
                    </button>
                ))}
            </div>
            {!courses.loading && !courses.error && (
                <p class="ca-connected">
                    <span class="ca-dot" aria-hidden="true" />
                    Connected to {count} Canvas {count === 1 ? 'course' : 'courses'}
                </p>
            )}
        </div>
    );
}
