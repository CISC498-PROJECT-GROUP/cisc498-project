// The round button fixed to the bottom-right corner that opens and closes the panel.

import type { Ref } from 'preact';
import { Icon } from '@/components/common/icon';

interface LauncherProps {
    open: boolean;
    onToggle: () => void;
    buttonRef: Ref<HTMLButtonElement>;
}

export function Launcher({ open, onToggle, buttonRef }: LauncherProps) {
    return (
        <button ref={buttonRef} type="button" class="ca-launcher" onClick={onToggle} aria-expanded={open} aria-label={open ? 'Close Canvas Assistant' : 'Open Canvas Assistant'}>
            <Icon name={open ? 'close' : 'chat'} size={open ? 24 : 26} />
        </button>
    );
}
