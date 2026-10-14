// One of the four shortcuts along the bottom of the home screen: an icon over a one-word label.
// `primary` marks Ask, the shortcut the home screen most wants tapped.

import { Icon, type IconName } from '@/components/common/icon';

interface NavTileProps {
    icon: IconName;
    label: string;
    primary?: boolean;
    onSelect: () => void;
}

export function NavTile({ icon, label, primary = false, onSelect }: NavTileProps) {
    return (
        <button type="button" class={`ca-shortcut ${primary ? 'ca-shortcut--primary' : ''}`} onClick={onSelect}>
            <Icon name={icon} size={16} />
            <span>{label}</span>
        </button>
    );
}
