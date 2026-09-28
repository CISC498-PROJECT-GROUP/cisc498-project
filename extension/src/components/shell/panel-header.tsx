// Header for every view except home: back to the menu, the view's title, then the view's own
// actions, expand/shrink, and close.

import type { ComponentChildren } from 'preact';
import { Icon } from '@/components/common/icon';

interface PanelHeaderProps {
    title: string;
    expanded: boolean;
    onBack: () => void;
    onExpand: () => void;
    onClose: () => void;
    actions?: ComponentChildren;
}

export function PanelHeader({ title, expanded, onBack, onExpand, onClose, actions }: PanelHeaderProps) {
    return (
        <header class="ca-subheader">
            <button type="button" class="ca-icon-btn" onClick={onBack} aria-label="Back to menu">
                <Icon name="back" />
            </button>
            <h2 class="ca-subheader-title">{title}</h2>
            {actions}
            <button type="button" class="ca-icon-btn ca-icon-btn--muted" onClick={onExpand} aria-label={expanded ? 'Shrink panel' : 'Expand panel'} title={expanded ? 'Shrink' : 'Expand'}>
                <Icon name={expanded ? 'shrink' : 'expand'} size={17} />
            </button>
            <button type="button" class="ca-icon-btn ca-icon-btn--muted" onClick={onClose} aria-label="Close assistant" title="Close (Esc)">
                <Icon name="close" size={18} />
            </button>
        </header>
    );
}
