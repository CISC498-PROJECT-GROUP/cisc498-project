// The round button fixed to the bottom-right corner that opens and closes the panel. The icon
// crossfades between the two states; a ring pulses while the assistant is working on an answer, so
// a student who closed the panel mid-question can see it is still going.

import type { Ref } from 'preact';
import { Icon } from '@/components/common/icon';

interface LauncherProps {
    open: boolean;
    busy: boolean;
    onToggle: () => void;
    buttonRef: Ref<HTMLButtonElement>;
}

export function Launcher({ open, busy, onToggle, buttonRef }: LauncherProps) {
    return (
        <button
            ref={buttonRef}
            type="button"
            class={`ca-launcher ${open ? 'ca-launcher--open' : ''} ${busy && !open ? 'ca-launcher--busy' : ''}`}
            onClick={onToggle}
            aria-expanded={open}
            aria-label={open ? 'Close Canvas Assistant' : 'Open Canvas Assistant'}>
            <span class="ca-launcher-icon ca-launcher-icon--closed">
                <Icon name="sparkle" size={24} />
            </span>
            <span class="ca-launcher-icon ca-launcher-icon--open">
                <Icon name="close" size={22} />
            </span>
        </button>
    );
}
