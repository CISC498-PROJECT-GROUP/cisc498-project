// A link-off row in the support view. Always opens in a new tab so the student keeps their place.

import { Icon, type IconName } from '@/components/common/icon';

interface HelpLinkProps {
    href: string;
    icon: IconName;
    label: string;
    description: string;
}

export function HelpLink({ href, icon, label, description }: HelpLinkProps) {
    return (
        <a class="ca-card ca-link-row" href={href} target="_blank" rel="noopener noreferrer">
            <span class="ca-tile ca-tile--sm">
                <Icon name={icon} size={18} />
            </span>
            <span class="ca-menu-text">
                <span class="ca-menu-label">{label}</span>
                <span class="ca-menu-desc">{description}</span>
            </span>
            <span class="ca-chevron">
                <Icon name="external" size={16} />
            </span>
        </a>
    );
}
