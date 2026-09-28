// One row of the home menu: icon tile, label, one-line description, chevron.

import { Icon, type IconName } from '@/components/common/icon';

interface MenuItemProps {
    icon: IconName;
    label: string;
    description: string;
    onSelect: () => void;
}

export function MenuItem({ icon, label, description, onSelect }: MenuItemProps) {
    return (
        <button type="button" class="ca-menu-item" onClick={onSelect}>
            <span class="ca-tile">
                <Icon name={icon} />
            </span>
            <span class="ca-menu-text">
                <span class="ca-menu-label">{label}</span>
                <span class="ca-menu-desc">{description}</span>
            </span>
            <span class="ca-chevron">
                <Icon name="chevron" size={18} />
            </span>
        </button>
    );
}
