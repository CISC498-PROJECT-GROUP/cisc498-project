// One of the four shortcuts on the home screen.

import { Icon, type IconName } from '@/components/common/icon';

interface NavTileProps {
    icon: IconName;
    label: string;
    hint: string;
    onSelect: () => void;
}

export function NavTile({ icon, label, hint, onSelect }: NavTileProps) {
    return (
        <button type="button" class="ca-tile-btn" onClick={onSelect}>
            <span class="ca-tile-icon">
                <Icon name={icon} size={19} />
            </span>
            <span class="ca-tile-text">
                <span class="ca-tile-label">{label}</span>
                <span class="ca-tile-hint">{hint}</span>
            </span>
        </button>
    );
}
