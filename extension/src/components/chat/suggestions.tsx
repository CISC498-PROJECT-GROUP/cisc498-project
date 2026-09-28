// Starter questions shown while the thread holds only the greeting — one tap sends it.

const SUGGESTIONS = ["What's due this week?", 'Am I missing any assignments?', 'How am I doing in my classes?', "What's the late policy in each of my courses?"];

export function Suggestions({ onPick }: { onPick: (question: string) => void }) {
    return (
        <div class="ca-suggestions">
            {SUGGESTIONS.map((question) => (
                <button key={question} type="button" class="ca-chip" onClick={() => onPick(question)}>
                    {question}
                </button>
            ))}
        </div>
    );
}
