// The page's top bar: the product mark and name, and the two systems the page reads, each a link
// out to the real thing.

import { Icon } from '@/components/common/icon';
import { CANVAS_ORIGIN, STELLIC_ORIGIN } from '@/services/school';

export function TopBar() {
    return (
        <header class="ca-topbar">
            <div class="ca-topbar-brand">
                <span class="ca-mark" aria-hidden="true">
                    <Icon name="sparkle" size={15} />
                </span>
                <span class="ca-topbar-name">Canvas Assistant</span>
                <span class="ca-topbar-sep" aria-hidden="true" />
                <span class="ca-topbar-page">Dashboard</span>
            </div>
            <nav class="ca-topbar-links" aria-label="Open the source systems">
                <a class="ca-topbar-link" href={`${CANVAS_ORIGIN}/`} target="_blank" rel="noreferrer">
                    Canvas
                    <Icon name="arrowUpRight" size={13} />
                </a>
                <a class="ca-topbar-link" href={`${STELLIC_ORIGIN}/app/planner`} target="_blank" rel="noreferrer">
                    Stellic
                    <Icon name="arrowUpRight" size={13} />
                </a>
            </nav>
        </header>
    );
}
