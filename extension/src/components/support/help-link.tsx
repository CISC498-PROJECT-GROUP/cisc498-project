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
        <a class="ca-row ca-row--link" href={href} target="_blank" rel="noopener noreferrer">
            <span class="ca-row-icon">
                <Icon name={icon} size={17} />
            </span>
            <span class="ca-row-main">
                <span class="ca-row-title">{label}</span>
                <span class="ca-row-meta">{description}</span>
            </span>
            <span class="ca-row-end">
                <Icon name="external" size={15} />
            </span>
        </a>
    );
}
