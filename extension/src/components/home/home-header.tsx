// The home screen's brand row: the assistant's mark and name, and close. Sub-views use PanelHeader
// instead, with a back button and their own title.

import { Icon } from '@/components/common/icon';

export function HomeHeader({ onClose }: { onClose: () => void }) {
    return (
        <header class="ca-brand">
            <span class="ca-brand-name">
                <span class="ca-mark" aria-hidden="true">
                    <Icon name="sparkle" size={15} />
                </span>
                Canvas Assistant
            </span>
            <button type="button" class="ca-icon-btn" onClick={onClose} aria-label="Close assistant" title="Close (Esc)">
                <Icon name="close" size={19} />
            </button>
        </header>
    );
}
