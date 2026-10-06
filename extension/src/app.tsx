// The widget root: whether the panel is open (and expanded), which view it shows, the assignment
// being submitted, and the chat conversation. The conversation lives HERE rather than in the chat
// view so it survives a trip back to the menu.
//
// Keyboard events are stopped at this root. Canvas binds global keyboard shortcuts on document,
// and an event from inside a shadow root reaches document retargeted to our host <div> — so
// Canvas would see typing in the chat box as keystrokes on the page and act on them.

import { useCallback, useRef, useState } from 'preact/hooks';
import { Launcher } from '@/components/shell/launcher';
import { Panel } from '@/components/shell/panel';
import { useChat } from '@/services/hooks/use-chat';
import type { Deadline, View } from '@/services/types';

const stop = (event: Event) => event.stopPropagation();

export function App() {
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [view, setView] = useState<View>('home');
    const [submitting, setSubmitting] = useState<Deadline | null>(null);
    const chat = useChat();
    const launcher = useRef<HTMLButtonElement>(null);

    const close = useCallback(() => {
        setOpen(false);
        launcher.current?.focus();
    }, []);

    const askInChat = useCallback(
        (question: string) => {
            setView('chat');
            chat.send(question);
        },
        [chat.send],
    );

    const openSubmit = useCallback((deadline: Deadline) => {
        setSubmitting(deadline);
        setView('submit');
    }, []);

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && open) close();
        event.stopPropagation();
    };

    return (
        <div class="ca-app" onKeyDown={onKeyDown} onKeyUp={stop} onKeyPress={stop}>
            {open && <Panel view={view} expanded={expanded} onExpand={() => setExpanded(!expanded)} onNavigate={setView} onClose={close} chat={chat} onAsk={askInChat} submitting={submitting} onSubmit={openSubmit} />}
            <Launcher open={open} busy={chat.pending} onToggle={() => (open ? close() : setOpen(true))} buttonRef={launcher} />
        </div>
    );
}
