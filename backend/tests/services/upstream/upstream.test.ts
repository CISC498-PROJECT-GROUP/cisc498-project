import { afterEach, describe, expect, it, mock } from 'bun:test';
import { SignedOutError } from '@/services/auth/cas';
import { jarGet, jarStore } from '@/services/auth/cookie-jar';
import { createSession, endSession } from '@/services/auth/sessions';
import { upstreamFetch, UpstreamRefusedError } from '@/services/upstream/upstream';

const realFetch = globalThis.fetch;
afterEach(() => {
    globalThis.fetch = realFetch;
});

type Seen = { url: string; method: string; headers: Headers };

function stub(answer: (url: URL, init: RequestInit) => Response): Seen[] {
    const seen: Seen[] = [];
    globalThis.fetch = mock(async (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(String(input));
        seen.push({ url: url.href, method: init?.method ?? 'GET', headers: new Headers(init?.headers) });
        return answer(url, init ?? {});
    }) as unknown as typeof fetch;
    return seen;
}

const request = (url: string, method = 'GET', body: string | null = null) => ({
    url: new URL(url),
    method,
    headers: new Headers({ accept: 'application/json', cookie: 'ca_session=never-forwarded' }),
    body: body === null ? null : new TextEncoder().encode(body).buffer,
});

describe('upstream fetch', () => {
    it('carries the student’s cookies, never the site’s own, and keeps what UD sets', async () => {
        const session = createSession('student');
        jarStore(session.jar, new URL('https://udel.instructure.com/'), ['canvas_session=s1; Path=/']);
        const seen = stub(() => new Response('[]', { headers: { 'content-type': 'application/json', 'set-cookie': 'canvas_session=s2; Path=/' } }));
        const out = await upstreamFetch(session, request('https://udel.instructure.com/api/v1/courses'));
        expect(out.status).toBe(200);
        expect(seen[0]!.headers.get('cookie')).toBe('canvas_session=s1');
        expect(jarGet(session.jar, new URL('https://udel.instructure.com/'), 'canvas_session')).toBe('s2');
        await endSession(session.id);
    });

    it('gives Stellic POSTs the CSRF token and Stellic’s own Origin', async () => {
        const session = createSession('student');
        jarStore(session.jar, new URL('https://stellic.udel.edu/'), ['csrftoken=tok; Path=/']);
        const seen = stub(() => new Response(")]}',\n{}", { headers: { 'content-type': 'application/json' } }));
        await upstreamFetch(session, request('https://stellic.udel.edu/planner/getstudentplan/', 'POST', 'include_grades=true'));
        expect(seen[0]!.headers.get('x-csrftoken')).toBe('tok');
        expect(seen[0]!.headers.get('origin')).toBe('https://stellic.udel.edu');
        await endSession(session.id);
    });

    it('reads WebReg’s CSRF token off a page before its first write', async () => {
        const session = createSession('student');
        const seen = stub((url) =>
            url.pathname === '/registration/'
                ? new Response('<html><head><meta name="_csrf" content="spring-token"/></head></html>', { headers: { 'content-type': 'text/html' } })
                : Response.json({ result: 'SUCCESS', object: { queueId: 'q1', nextPollTime: 3000 } }),
        );
        await upstreamFetch(session, request('https://webreg.nss.udel.edu/registration/sisqueue/drop', 'POST', '{"courses":[]}'));
        expect(seen.map((s) => `${s.method} ${new URL(s.url).pathname}`)).toEqual(['GET /registration/', 'POST /registration/sisqueue/drop']);
        expect(seen[1]!.headers.get('x-csrf-token')).toBe('spring-token');
        await endSession(session.id);
    });

    it('follows an allowed redirect itself and reports where it ended', async () => {
        const session = createSession('student');
        stub((url) => (url.hostname === 'udel.instructure.com' ? new Response(null, { status: 302, headers: { location: 'https://inst-fs-iad-prod.inscloudgate.net/f/1' } }) : new Response('%PDF', { headers: { 'content-type': 'application/pdf' } })));
        const out = await upstreamFetch(session, request('https://udel.instructure.com/files/1/download'));
        expect(out.url).toBe('https://inst-fs-iad-prod.inscloudgate.net/f/1');
        expect(out.contentType).toBe('application/pdf');
        await endSession(session.id);
    });

    it('treats a redirect to CAS as a lapsed session, and signs out when it cannot renew', async () => {
        const session = createSession('student');
        stub(() => new Response(null, { status: 302, headers: { location: 'https://cas.nss.udel.edu/cas/login?service=x' } }));
        await expect(upstreamFetch(session, request('https://webreg.nss.udel.edu/registration/schedule/2273'))).rejects.toBeInstanceOf(SignedOutError);
        await endSession(session.id);
    });

    it('refuses hosts and writes the policy does not allow, before any request', async () => {
        const session = createSession('student');
        const seen = stub(() => new Response('x'));
        await expect(upstreamFetch(session, request('https://example.com/'))).rejects.toBeInstanceOf(UpstreamRefusedError);
        await expect(upstreamFetch(session, request('https://udel.instructure.com/api/v1/conversations', 'POST', 'x'))).rejects.toBeInstanceOf(UpstreamRefusedError);
        expect(seen).toHaveLength(0);
        await endSession(session.id);
    });
});
