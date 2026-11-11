// /up/<host>/<path> — the site's window onto UD's systems, made with the signed-in student's session.
// The site's Canvas, Stellic, WebReg and Media Gallery clients send exactly the request they would
// send from a browser on that system, to this path instead; services/upstream/ decides whether it
// may go (policy.ts), adds the student's cookies and the headers each system wants, and follows the
// redirects.
//
// The one route that does not answer through rsp(): a successful proxied response is relayed as
// itself — its status, its body, its content type — because the clients parse UD's own formats.
// Failures (signed out, refused, UD down) still answer with the envelope. `X-Upstream-Url` carries
// where the request ended up after redirects, which the Media Gallery client needs.

import { Hono } from 'hono';
import { requireSession, signedInSession } from '@/routes/auth/common';
import { SignedOutError } from '@/services/auth/cas';
import { rsp, stc } from '@/services/common/svc-response';
import { createLogger } from '@/services/common/svc-log';
import { upstreamFetch, UpstreamRefusedError } from '@/services/upstream/upstream';

const log = createLogger('up');

export const router_up = new Hono<{ Variables: { session: ReturnType<typeof signedInSession> } }>();

router_up.use('*', requireSession);

router_up.all('/:host/*', async (c) => {
    const host = c.req.param('host').toLowerCase();
    const incoming = new URL(c.req.url);
    const path = incoming.pathname.replace(/^.*?\/up\/[^/]+/, '') || '/';
    let url: URL;
    try {
        url = new URL(`https://${host}${path}${incoming.search}`);
    } catch {
        return rsp(c, undefined, stc.INSUFFICIENT_PARAMS, 'Not a UD address.');
    }
    const method = c.req.method;
    const started = Date.now();
    try {
        const body = method === 'GET' || method === 'HEAD' ? null : await c.req.arrayBuffer();
        const upstream = await upstreamFetch(signedInSession(c), { url, method, headers: c.req.raw.headers, body });
        log.info('relayed', { host, method, status: upstream.status, ms: Date.now() - started });
        const headers = new Headers({ 'content-type': upstream.contentType || 'application/octet-stream', 'x-upstream-url': upstream.url, 'cache-control': 'no-store' });
        if (upstream.contentDisposition) headers.set('content-disposition', upstream.contentDisposition);
        if (upstream.link) headers.set('link', upstream.link);
        return new Response(upstream.body, { status: upstream.status, headers });
    } catch (error) {
        if (error instanceof SignedOutError) return rsp(c, undefined, stc.UNAUTHORIZED, error.message);
        if (error instanceof UpstreamRefusedError) {
            log.warn('refused', { host, method, reason: error.message });
            return rsp(c, undefined, stc.FORBIDDEN, `The site won't do that: ${error.message}.`);
        }
        log.warn('upstream failed', { host, method, kind: error instanceof Error ? error.name : 'unknown', ms: Date.now() - started });
        return rsp(c, undefined, stc.BAD_GATEWAY, `${host} didn't answer. Try again in a moment.`);
    }
});
