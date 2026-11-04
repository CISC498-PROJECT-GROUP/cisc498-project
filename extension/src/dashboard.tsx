// Entry for the dashboard page (dashboard.html, an extension page opened from the toolbar button).
// It is not on Canvas, so the Canvas client is pointed at the school's Canvas first; the page's
// host_permissions let it call Canvas and Stellic with the student's own sessions.
//
// No shadow root here — the page is ours — but the same token sheet and the shared feedback styles
// are used, with the dashboard's own sheets after them.

import { render } from 'preact';
import { Dashboard } from '@/components/dashboard/dashboard';
import { setCanvasOrigin } from '@/services/canvas/canvas-api';
import { CANVAS_ORIGIN } from '@/services/school';
import { PAGE_CSS } from '@/styles/page';

setCanvasOrigin(CANVAS_ORIGIN);

const style = document.createElement('style');
style.textContent = PAGE_CSS;
document.head.appendChild(style);

const root = document.getElementById('app')!;
root.className = 'ca-root ca-page';
render(<Dashboard />, root);
