// Content-script entry. Chrome injects this into every page the manifest matches; it mounts the
// assistant only on the Canvas dashboard and does nothing anywhere else.
//
// The widget renders inside a SHADOW ROOT on a host element of its own. That is the isolation
// boundary in both directions: Canvas's global CSS cannot restyle the widget, and the widget's CSS
// cannot leak onto Canvas. CSS custom properties DO cross it, which is how the widget inherits the
// school's brand colour (--ic-brand-primary) without reading the page's scripts.

import { render } from 'preact';
import { App } from '@/app';
import { isDashboard } from '@/services/canvas/canvas-page';
import { WIDGET_CSS } from '@/styles';

const HOST_ID = 'canvas-assistant-root';

function mount(): void {
    if (!isDashboard(window.location.pathname) || document.getElementById(HOST_ID)) return;

    const host = document.createElement('div');
    host.id = HOST_ID;
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = WIDGET_CSS;
    shadow.appendChild(style);

    const root = document.createElement('div');
    root.className = 'ca-root';
    shadow.appendChild(root);
    render(<App />, root);
}

mount();
