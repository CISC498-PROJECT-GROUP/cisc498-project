// The heading every page opens with: a small kicker, the page's title, a line under it, and the
// page's own actions at the right (on a phone, under it).

import type { ComponentChildren } from 'preact';

interface PageHeadProps {
    title: string;
    kicker?: string;
    sub?: ComponentChildren;
    actions?: ComponentChildren;
}

export function PageHead({ title, kicker, sub, actions }: PageHeadProps) {
    return (
        <header class="ca-page-head">
            <div class="ca-page-head-text">
                {kicker && <p class="ca-page-kicker">{kicker}</p>}
                <h1 class="ca-page-title">{title}</h1>
                {sub && <p class="ca-page-sub">{sub}</p>}
            </div>
            {actions && <div class="ca-page-actions">{actions}</div>}
        </header>
    );
}
