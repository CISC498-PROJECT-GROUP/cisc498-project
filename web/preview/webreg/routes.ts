// The stand-in WebReg: the endpoints the site calls, over invented terms, courses and an in-memory
// registered schedule (docs/webreg-integration.html describes the real ones). /registration/
// redirects to the current term; a schedule page makes its term the session's current one; writes
// need the page's CSRF token, as Spring Security's would. Nothing here reaches UD. Never bundled.

import { CSRF_TOKEN, schedulePage } from './page';
import { sisqueuePoll, sisqueueWrite } from './queue';
import { envelope, failure, sectionInfo, sectionLabel } from './shapes';
import { coursesIn, CURRENT_STRM, findSection, lectureOf, REGISTERED, termOf, webregSession } from './state';

function lookupCourses(strm: string, prefix: string): Response {
    const want = prefix.toUpperCase();
    const courses = coursesIn(strm);
    const exact = courses.find((c) => want.startsWith(c.id));
    if (exact) return envelope({ items: exact.sections.filter((s) => s.id.startsWith(want)).map((s) => ({ label: sectionLabel(s), value: s.id })) });
    const items = courses.filter((c) => c.id.startsWith(want)).map((c) => ({ label: `${c.id}: ${c.title}`, value: c.id }));
    return envelope({ items: items.slice(0, 25) });
}

function lookupInfo(strm: string, id: string): Response {
    const found = findSection(strm, id.toUpperCase());
    return found ? envelope(sectionInfo(strm, found.course, found.section)) : failure([`No section ${id} in this term.`]);
}

/** The registered sections a drop of `id` takes with it. */
function check(id: string): Response {
    const strm = webregSession.strm;
    const registered = REGISTERED[strm] ?? [];
    const labs = (findSection(strm, id)?.section.labs ?? []).filter((lab) => registered.some((e) => e.id === lab));
    const lecture = lectureOf(strm, id);
    return envelope({ corequisites: lecture ? [lecture] : labs });
}

function get(url: URL): Response | null {
    const path = url.pathname.replace(/\/+$/, '');
    if (path === '/registration' || path === '/registration/start') return new Response(null, { status: 302, headers: { location: `/registration/schedule/${CURRENT_STRM}` } });
    let m = /^\/registration\/schedule\/(\d{4})$/.exec(path);
    if (m) {
        const term = termOf(m[1]);
        if (!term) return new Response('Term not found', { status: 404 });
        webregSession.strm = term.strm;
        return schedulePage(term);
    }
    if ((m = /^\/registration\/lookupCourses\/(\d{4})\/([^/]+)$/.exec(path))) return lookupCourses(m[1], decodeURIComponent(m[2]));
    if ((m = /^\/registration\/lookupCourseInfo\/(\d{4})\/([^/]+)$/.exec(path))) return lookupInfo(m[1], decodeURIComponent(m[2]));
    if ((m = /^\/registration\/check\/([^/]+)$/.exec(path))) return check(decodeURIComponent(m[1]).toUpperCase());
    if (path === '/registration/sisqueue/poll') return sisqueuePoll(url);
    if (path === '/registration/keepAlive') return new Response('OK');
    return null;
}

export function webregRoute(req: Request, url: URL): Promise<Response | null> | Response | null {
    if (req.method === 'GET' || req.method === 'HEAD') return get(url);
    const m = /^\/registration\/sisqueue\/(add|drop|swap|edit)$/.exec(url.pathname);
    if (req.method !== 'POST' || !m) return null;
    if (req.headers.get('x-csrf-token') !== CSRF_TOKEN) return new Response('Invalid CSRF Token', { status: 403 });
    return sisqueueWrite(m[1], req);
}
