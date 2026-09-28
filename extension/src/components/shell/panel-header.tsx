// Header for every view except home: back to the menu, the view's title, close.

import { Icon } from '@/components/common/icon';

interface PanelHeaderProps {
    title: string;
    onBack: () => void;
    onClose: () => void;
}

export function PanelHeader({ title, onBack, onClose }: PanelHeaderProps) {
    return (
        <header class="ca-subheader">
            <button type="button" class="ca-icon-btn" onClick={onBack} aria-label="Back to menu">
                <Icon name="back" />
            </button>
            <h2 class="ca-subheader-title">{title}</h2>
            <button type="button" class="ca-icon-btn ca-icon-btn--muted" onClick={onClose} aria-label="Close assistant">
                <Icon name="close" size={18} />
            </button>
        </header>
    );
}
