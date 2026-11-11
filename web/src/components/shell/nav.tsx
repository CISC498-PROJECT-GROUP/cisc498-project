// The site's navigation: one link per page. The same list is a sidebar on a wide screen (brand on
// top, labels beside icons), icons only on a tablet, and a bar along the bottom on a phone — the
// layout is all CSS (shell.css). A small dot on Assistant shows it is still working on an answer
// while the student is on another page.

import { Icon } from '@/components/common/icon';
import { routeHref, ROUTES, type RouteId } from '@/services/routes';

export function Nav({ route, busy }: { route: RouteId; busy: boolean }) {
    return (
        <nav class="ca-nav" aria-label="Pages">
            <a class="ca-nav-brand" href="#/" aria-label="Canvas Assistant — home">
                <span class="ca-mark" aria-hidden="true">
                    <Icon name="sparkle" size={15} />
                </span>
                <span class="ca-nav-brand-name">Canvas Assistant</span>
            </a>
            <ul class="ca-nav-list">
                {ROUTES.map((r) => (
                    <li key={r.id}>
                        <a class={`ca-nav-link ${route === r.id ? 'ca-nav-link--on' : ''}`} href={routeHref(r.id)} aria-current={route === r.id ? 'page' : undefined} title={r.label}>
                            <span class="ca-nav-icon">
                                <Icon name={r.icon} size={19} />
                                {r.id === 'assistant' && busy && <span class="ca-nav-busy" aria-label="Working on an answer" />}
                            </span>
                            <span class="ca-nav-label">{r.label}</span>
                            <span class="ca-nav-short" aria-hidden="true">
                                {r.short}
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
            <p class="ca-nav-foot">Reads your own Canvas, Stellic and WebReg. Nothing is stored.</p>
        </nav>
    );
}
