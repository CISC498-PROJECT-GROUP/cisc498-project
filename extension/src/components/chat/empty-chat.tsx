// What a new chat shows: what the assistant can do, and questions to start with — one tap sends.

import { Icon, type IconName } from '@/components/common/icon';

const STARTERS: { icon: IconName; text: string }[] = [
    { icon: 'calendar', text: "What's due this week?" },
    { icon: 'alert', text: 'Am I missing any assignments?' },
    { icon: 'grades', text: 'How am I doing in each class?' },
    { icon: 'book', text: "What's the late policy in my courses?" },
];

export function EmptyChat({ onPick }: { onPick: (question: string) => void }) {
    return (
        <div class="ca-empty-chat">
            <span class="ca-avatar ca-avatar--lg" aria-hidden="true">
                <Icon name="sparkle" size={22} />
            </span>
            <h3 class="ca-empty-title">Ask about your courses</h3>
            <p class="ca-empty-sub">I read your syllabi, assignments, grades and announcements — and find the syllabus even when it's buried in a PDF.</p>
            <div class="ca-starters">
                {STARTERS.map((s) => (
                    <button key={s.text} type="button" class="ca-starter" onClick={() => onPick(s.text)}>
                        <Icon name={s.icon} size={16} />
                        <span>{s.text}</span>
                        <span class="ca-starter-go">
                            <Icon name="arrow" size={14} />
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
