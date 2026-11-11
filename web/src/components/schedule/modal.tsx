// A modal on the browser's own <dialog>: showModal() traps focus and makes the page behind it inert,
// Escape closes it (unless `locked` — while a registration is being sent), and focus returns to
// where it was when it closes.

import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Icon } from '@/components/common/icon';

interface ModalProps {
    title: string;
    onClose: () => void;
    locked?: boolean;
    children: ComponentChildren;
}

export function Modal({ title, onClose, locked = false, children }: ModalProps) {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = ref.current;
        const before = document.activeElement as HTMLElement | null;
        if (dialog && !dialog.open) dialog.showModal();
        return () => {
            dialog?.close();
            before?.focus?.();
        };
    }, []);

    const cancel = (event: Event) => {
        event.preventDefault();
        if (!locked) onClose();
    };

    return (
        <dialog ref={ref} class="ca-modal" aria-labelledby="ca-modal-title" onCancel={cancel}>
            <div class="ca-modal-head">
                <h2 class="ca-modal-title" id="ca-modal-title">
                    {title}
                </h2>
                <button type="button" class="ca-icon-btn" aria-label="Close" disabled={locked} onClick={onClose}>
                    <Icon name="close" size={16} />
                </button>
            </div>
            <div class="ca-modal-body">{children}</div>
        </dialog>
    );
}
