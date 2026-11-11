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
        <a class="ca-help-link" href={href} target="_blank" rel="noopener noreferrer">
            <span class="ca-help-icon">
                <Icon name={icon} size={19} />
            </span>
            <span class="ca-help-text">
                <span class="ca-help-title">{label}</span>
                <span class="ca-help-desc">{description}</span>
            </span>
            <Icon name="external" size={14} />
        </a>
    );
}
