// The accent-coloured greeting header shown on the home menu.

import { Icon } from '@/components/common/icon';
import { useStudent } from '@/services/hooks/use-student';

export function HomeHeader({ onClose }: { onClose: () => void }) {
    const student = useStudent();
    const first = student.data?.shortName.split(' ')[0];

    return (
        <header class="ca-hero">
            <div class="ca-hero-top">
                <span class="ca-hero-name">
                    <span class="ca-dot" aria-hidden="true" />
                    Canvas Assistant
                </span>
                <button type="button" class="ca-icon-btn ca-icon-btn--on-accent" onClick={onClose} aria-label="Close assistant">
                    <Icon name="close" size={18} />
                </button>
            </div>
            <h2 class="ca-hero-title">
                Hi {first ?? 'there'}.
                <br />
                What do you need?
            </h2>
        </header>
    );
}
