// Home's way into the assistant: a composer and a few one-tap questions. Sending takes the student
// to the Assistant page with the question already on its way. With overdue work, the first
// suggestion is the catch-up plan.

import { Composer } from '@/components/chat/composer';
import { Icon } from '@/components/common/icon';

interface AskCardProps {
    onAsk: (question: string) => void;
    overdue: boolean;
}

const CATCH_UP = 'Help me catch up: what is overdue, what does each course say about late work, and what should I do first?';
const PLAN_48H = 'Plan my next 48 hours: what is due, roughly how long each will take, and what order should I do them in?';

export function AskCard({ onAsk, overdue }: AskCardProps) {
    const starters = [
        overdue ? { label: 'Help me catch up', text: CATCH_UP } : { label: 'Plan my next 48 hours', text: PLAN_48H },
        { label: 'How am I doing in each class?', text: 'How am I doing in each class?' },
        { label: 'Late policies', text: "What's the late policy in each of my courses?" },
    ];
    return (
        <section class="ca-ask-card" aria-label="Ask the assistant">
            <div class="ca-ask-head">
                <span class="ca-avatar" aria-hidden="true">
                    <Icon name="sparkle" size={15} />
                </span>
                <div>
                    <h2 class="ca-dash-card-title">Ask the assistant</h2>
                    <p class="ca-ask-sub">It reads your syllabi, assignments, grades and recorded lectures.</p>
                </div>
            </div>
            <Composer onSend={onAsk} placeholder="Ask anything about your courses…" autoFocus={false} />
            <div class="ca-ask-starters">
                {starters.map((s) => (
                    <button key={s.label} type="button" class="ca-chip ca-chip--lg" onClick={() => onAsk(s.text)}>
                        {s.label}
                    </button>
                ))}
            </div>
        </section>
    );
}
