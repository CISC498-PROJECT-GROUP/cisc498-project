// A stand-in Canvas dashboard for working on the widget without a Canvas login. Serves
// preview/index.html at / and the built content script beside it, so the same bundle Chrome
// injects runs here unmodified. It is a harness, not a Canvas replica — layout only.
//
// Only works while the content script needs no chrome.* API; once it does, test in Chrome.

import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const PORT = 5174;

Bun.serve({
    port: PORT,
    fetch(req) {
        const { pathname } = new URL(req.url);
        if (pathname === '/content.js') return new Response(Bun.file(join(ROOT, 'dist', 'content.js')));
        if (pathname === '/') return new Response(Bun.file(join(ROOT, 'preview', 'index.html')));
        return new Response('Not found', { status: 404 });
    },
});

console.log(`[preview] http://localhost:${PORT}`);
