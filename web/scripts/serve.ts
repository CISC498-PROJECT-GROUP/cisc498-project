// The site's development server on :5175. It serves dist/ (any unknown path gets index.html — the
// app routes on the hash, so this is only for a refresh) and relays /api/* to the backend, so the
// browser sees one origin: the session cookie is first-party and there is no CORS.
//
//   bun run scripts/serve.ts             → the real UD, through the backend on :3010 (bun run dev:api)
//   bun run scripts/serve.ts --standin   → the stand-in UD: serves preview/ fixtures on /__standin and
//                                          starts its own backend on :3011 with UD_STANDIN pointing here,
//                                          so no request reaches UD — registration writes included.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { standinRoute } from '../preview/standin';

const ROOT = join(import.meta.dir, '..');
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.WEB_PORT ?? 5175);
const STANDIN = process.argv.includes('--standin');
const API_PORT = Number(process.env.API_PORT ?? (STANDIN ? 3011 : 3010));
const API = `http://127.0.0.1:${API_PORT}`;

if (STANDIN) {
    const backend = Bun.spawn(['bun', 'run', 'src/index.ts'], { cwd: join(ROOT, '..', 'backend'), env: { ...process.env, PORT: String(API_PORT), UD_STANDIN: `http://localhost:${PORT}/__standin` }, stdout: 'inherit', stderr: 'inherit' });
    process.on('exit', () => backend.kill());
    process.on('SIGINT', () => process.exit(0));
}

async function relay(req: Request, url: URL): Promise<Response> {
    const target = `${API}${url.pathname.replace(/^\/api/, '')}${url.search}`;
    const headers = new Headers(req.headers);
    headers.delete('host');
    headers.set('x-forwarded-proto', url.protocol.replace(':', ''));
    try {
        const response = await fetch(target, { method: req.method, headers, body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer(), redirect: 'manual' });
        return new Response(response.body, { status: response.status, headers: response.headers });
    } catch {
        return Response.json({ data: null, statusCode: 502, message: `The backend isn't running on ${API} — start it with bun run dev:api.` }, { status: 502 });
    }
}

function file(url: URL): Response {
    const path = join(DIST, decodeURIComponent(url.pathname));
    if (url.pathname !== '/' && path.startsWith(DIST) && existsSync(path)) return new Response(Bun.file(path));
    return new Response(Bun.file(join(DIST, 'index.html')), { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

Bun.serve({
    port: PORT,
    idleTimeout: 255,
    async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return relay(req, url);
        if (url.pathname.startsWith('/__standin/')) return STANDIN ? standinRoute(req, url) : new Response('Not found', { status: 404 });
        return file(url);
    },
});

console.log(`[serve] http://localhost:${PORT} — API ${API}${STANDIN ? ' (stand-in UD — nothing reaches UD)' : ''}`);
