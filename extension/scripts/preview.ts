// A stand-in Canvas dashboard for working on the widget without a Canvas login. Serves
// preview/index.html at /, the built content script beside it, and a fake Canvas REST API
// (preview/canvas/) over invented fixture data — so the same bundle Chrome injects runs here
// unmodified, tool calls included. Chat goes to the real backend: start it with `bun run dev:api`.
//
// The fixtures live in preview/ and are never bundled into the extension.

import { join } from 'node:path';
import { canvasRoute, fileDownload } from '../preview/canvas/routes';
import { submissionRoute, uploadRoute } from '../preview/canvas/submissions';

const ROOT = join(import.meta.dir, '..');
const PORT = 5174;

Bun.serve({
    port: PORT,
    fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === '/content.js') return new Response(Bun.file(join(ROOT, 'dist', 'content.js')));
        // Canvas sets a readable CSRF cookie that writes must echo back; the stand-in does the same.
        if (url.pathname === '/') return new Response(Bun.file(join(ROOT, 'preview', 'index.html')), { headers: { 'set-cookie': '_csrf_token=preview-token; Path=/; SameSite=Lax' } });
        if (url.pathname === '/preview-upload' && req.method === 'POST') return uploadRoute(req);
        if (url.pathname.startsWith('/api/v1/')) return req.method === 'POST' ? submissionRoute(req, url) : canvasRoute(url);
        return fileDownload(url) ?? new Response('Not found', { status: 404 });
    },
});

console.log(`[preview] http://localhost:${PORT} — fake Canvas API on /api/v1, chat via the backend`);
