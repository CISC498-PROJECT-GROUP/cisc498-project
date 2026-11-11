// A request to a UD system made with one student's session: the jar's cookies on it, the CSRF and
// Origin headers each system wants (headers.ts), redirects followed here — so cookies set along the
// way land in the jar — and only to hosts the policy allows.
//
// A lapsed service session shows up as a redirect to CAS or the IdP (or, from Canvas's API, a 401).
// The service is then renewed through single sign-on (auth/renew.ts) and the request tried once
// more; if that fails too the student is signed out (SignedOutError).
//
// With UD_STANDIN set every URL is rewritten to the stand-in (`<standin>/<host>/<path>`), and URLs
// coming back are rewritten to the real form — the site never knows the difference.

import { SignedOutError } from '@/services/auth/cas';
import { jarHeader, jarStore } from '@/services/auth/cookie-jar';
import { renewService } from '@/services/auth/renew';
import type { Session } from '@/services/auth/sessions';
import { isSignOnHost, serviceForHost } from '@/services/auth/ud-services';
import { app_env } from '@/services/common/svc-env';
import { sniffWebregCsrf, upstreamHeaders } from '@/services/upstream/headers';
import { allowRedirect, allowRequest, MAX_RESPONSE_BYTES } from '@/services/upstream/policy';

export class UpstreamRefusedError extends Error {}

export interface UpstreamRequest {
    url: URL;
    method: string;
    headers: Headers;
    body: ArrayBuffer | null;
}

export interface UpstreamResponse {
    status: number;
    contentType: string;
    contentDisposition: string | null;
    link: string | null;
    /** Where the request ended up, in real-UD form. */
    url: string;
    body: ArrayBuffer;
}

const MAX_HOPS = 10;
const toWire = (url: URL): URL => (app_env.ud_standin === '' ? url : new URL(`${app_env.ud_standin}/${url.hostname}${url.pathname}${url.search}`));
const fromWire = (raw: string, base: URL): URL => {
    const url = new URL(raw, base);
    const prefix = app_env.ud_standin;
    if (prefix === '' || !url.href.startsWith(`${prefix}/`)) return url;
    const [host, ...rest] = url.href.slice(prefix.length + 1).split('/');
    return new URL(`https://${host}/${rest.join('/')}`);
};

class Lapsed extends Error {}

async function attempt(session: Session, request: UpstreamRequest): Promise<UpstreamResponse> {
    let url = request.url;
    let method = request.method;
    let body = request.body;
    for (let hop = 0; hop < MAX_HOPS; hop++) {
        const headers = upstreamHeaders(session, url, method, request.headers);
        const cookie = jarHeader(session.jar, url);
        if (cookie) headers.set('cookie', cookie);
        const wire = toWire(url);
        const response = await fetch(wire, { method, headers, body: body ?? undefined, redirect: 'manual', signal: AbortSignal.timeout(90_000) });
        jarStore(session.jar, url, response.headers.getSetCookie());
        const location = response.headers.get('location');
        if (response.status >= 300 && response.status < 400 && location) {
            const next = fromWire(location, wire);
            if (isSignOnHost(next.hostname)) throw new Lapsed();
            if (!allowRedirect(next)) throw new UpstreamRefusedError(`refused a redirect to ${next.hostname}`);
            if (response.status !== 307 && response.status !== 308) {
                method = 'GET';
                body = null;
            }
            url = next;
            continue;
        }
        if (response.status === 401 && url.hostname === 'udel.instructure.com') throw new Lapsed();
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength > MAX_RESPONSE_BYTES) throw new UpstreamRefusedError('response too large');
        const contentType = response.headers.get('content-type') ?? '';
        sniffWebregCsrf(session, url, contentType, bytes);
        return { status: response.status, contentType, contentDisposition: response.headers.get('content-disposition'), link: response.headers.get('link'), url: url.href, body: bytes };
    }
    throw new UpstreamRefusedError('too many redirects');
}

/** WebReg refuses a POST without its CSRF token; read a page first if none is known yet. */
async function primeWebreg(session: Session, request: UpstreamRequest): Promise<void> {
    if (request.url.hostname !== 'webreg.nss.udel.edu' || request.method === 'GET' || session.webregCsrf) return;
    await attempt(session, { url: new URL('https://webreg.nss.udel.edu/registration/'), method: 'GET', headers: new Headers({ accept: 'text/html' }), body: null });
}

export async function upstreamFetch(session: Session, request: UpstreamRequest): Promise<UpstreamResponse> {
    const verdict = allowRequest(request.url, request.method);
    if (verdict === 'host') throw new UpstreamRefusedError(`${request.url.hostname} is not a UD system the site reads`);
    if (verdict === 'write') throw new UpstreamRefusedError(`the site does not ${request.method} to ${request.url.pathname}`);
    const service = serviceForHost(request.url.hostname);
    try {
        await primeWebreg(session, request);
        return await attempt(session, request);
    } catch (error) {
        if (!(error instanceof Lapsed)) throw error;
        if (!service) throw new SignedOutError('The Media Gallery session lapsed — open the lecture again.');
        await renewService(session, service);
        if (request.url.hostname === 'webreg.nss.udel.edu') session.webregCsrf = null;
        try {
            await primeWebreg(session, request);
            return await attempt(session, request);
        } catch (retryError) {
            if (retryError instanceof Lapsed) throw new SignedOutError();
            throw retryError;
        }
    }
}
