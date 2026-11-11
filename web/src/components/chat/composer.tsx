// The message box. A textarea that grows with its content up to a few lines: Enter sends,
// Shift+Enter starts a new line. Used by the chat and by the home screen.

import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '@/components/common/icon';

interface ComposerProps {
    onSend: (text: string) => void;
    disabled?: boolean;
    placeholder?: string;
    autoFocus?: boolean;
}

const MAX_HEIGHT = 132;

export function Composer({ onSend, disabled = false, placeholder = 'Ask a follow-up…', autoFocus = true }: ComposerProps) {
    const [draft, setDraft] = useState('');
    const box = useRef<HTMLTextAreaElement>(null);
    const empty = draft.trim() === '';

    useEffect(() => {
        if (autoFocus) box.current?.focus();
    }, []);

    useLayoutEffect(() => {
        const el = box.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    }, [draft]);

    const submit = () => {
        if (disabled || empty) return;
        onSend(draft);
        setDraft('');
    };

    return (
        <form
            class="ca-composer"
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}>
            <label for="ca-input" class="ca-sr-only">
                Message the assistant
            </label>
            <textarea
                ref={box}
                id="ca-input"
                class="ca-input"
                rows={1}
                placeholder={placeholder}
                value={draft}
                onInput={(e) => setDraft(e.currentTarget.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                        e.preventDefault();
                        submit();
                    }
                }}
            />
            <button type="submit" class="ca-send" aria-label="Send message" disabled={disabled || empty}>
                <Icon name="send" size={17} />
            </button>
        </form>
    );
}
