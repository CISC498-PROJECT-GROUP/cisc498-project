// The text box and send button under the thread. Enter sends; focus lands here when the chat opens.

import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '@/components/common/icon';

interface ComposerProps {
    onSend: (text: string) => void;
    disabled: boolean;
}

export function Composer({ onSend, disabled }: ComposerProps) {
    const [draft, setDraft] = useState('');
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => input.current?.focus(), []);

    const submit = (event: Event) => {
        event.preventDefault();
        if (disabled || draft.trim() === '') return;
        onSend(draft);
        setDraft('');
    };

    return (
        <form class="ca-composer" onSubmit={submit}>
            <label for="ca-input" class="ca-sr-only">
                Message the assistant
            </label>
            <input ref={input} id="ca-input" type="text" class="ca-input" placeholder="Ask a question…" autocomplete="off" value={draft} onInput={(e) => setDraft(e.currentTarget.value)} />
            <button type="submit" class="ca-send" aria-label="Send message" disabled={disabled || draft.trim() === ''}>
                <Icon name="arrow" size={18} />
            </button>
        </form>
    );
}
