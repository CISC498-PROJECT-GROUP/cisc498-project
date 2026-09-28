// A fake Canvas REST API over the preview fixtures, answering the endpoints the extension calls.

import { COLORS, COURSES, SYLLABI, USER } from './courses';
import { FILES, HIDDEN_PAGES, MODULES, PAGES } from './content';
import { ANNOUNCEMENTS, assignmentsOf, GROUPS, planner } from './work';

const json = (body: unknown, status = 200) => Response.json(body, { status });

export function canvasRoute(url: URL): Response {
    const p = url.pathname.replace(/^\/api\/v1/, '');
    const q = url.searchParams;
    let m: RegExpExecArray | null;

    if (p === '/users/self') return json(USER);
    if (p === '/users/self/colors') return json(COLORS);
    if (p === '/courses') return json(COURSES);
    if (p === '/planner/items') return json(planner(new Date(q.get('start_date')!), new Date(q.get('end_date')!)));
    if (p === '/announcements') return json(ANNOUNCEMENTS.filter((a) => q.getAll('context_codes[]').includes(a.context_code)));
    if ((m = /^\/courses\/(\d+)$/.exec(p))) {
        const course = COURSES.find((c) => c.id === Number(m![1]));
        return course ? json({ ...course, syllabus_body: SYLLABI[course.id] ?? '' }) : json({ errors: [{ message: 'not found' }] }, 404);
    }
    if ((m = /^\/courses\/(\d+)\/assignment_groups$/.exec(p))) return json((GROUPS[Number(m[1])] ?? []).map((g) => ({ ...g, assignments: assignmentsOf(Number(m![1])).filter((x) => x.assignment_group_id === g.id) })));
    if ((m = /^\/courses\/(\d+)\/assignments$/.exec(p))) return json(assignmentsOf(Number(m[1])).map(({ description: _d, ...rest }) => rest));
    if ((m = /^\/courses\/(\d+)\/assignments\/(\d+)$/.exec(p))) {
        const found = assignmentsOf(Number(m[1])).find((x) => x.id === Number(m![2]));
        return found ? json({ ...found, submission_types: ['online_upload'], allowed_attempts: -1 }) : json({}, 404);
    }
    if ((m = /^\/courses\/(\d+)\/pages$/.exec(p))) {
        if (HIDDEN_PAGES.has(Number(m[1]))) return json({ message: 'That page has been disabled for this course' }, 403);
        const term = (q.get('search_term') ?? '').toLowerCase();
        return json((PAGES[Number(m[1])] ?? []).filter((pg) => pg.title.toLowerCase().includes(term)).map(({ body: _b, ...rest }) => rest));
    }
    if ((m = /^\/courses\/(\d+)\/pages\/([\w-]+)$/.exec(p))) {
        const page = (PAGES[Number(m[1])] ?? []).find((pg) => pg.url === m![2]);
        return page ? json({ ...page, html_url: `/courses/${m[1]}/pages/${page.url}` }) : json({}, 404);
    }
    if ((m = /^\/courses\/(\d+)\/modules$/.exec(p))) return json(MODULES[Number(m[1])] ?? []);
    if ((m = /^\/courses\/(\d+)\/files$/.exec(p))) {
        const term = (q.get('search_term') ?? '').toLowerCase();
        return json(
            Object.values(FILES)
                .filter((f) => f.course === Number(m![1]) && f.display_name.toLowerCase().includes(term))
                .map(({ bytes: _b, ...rest }) => rest),
        );
    }
    if ((m = /^\/files\/(\d+)$/.exec(p))) {
        const file = FILES[Number(m[1])];
        return file ? json((({ bytes: _b, ...rest }) => rest)(file)) : json({}, 404);
    }
    return json({ errors: [{ message: `preview has no fixture for ${p}` }] }, 404);
}

export function fileDownload(url: URL): Response | null {
    const m = /^\/files\/(\d+)\/download$/.exec(url.pathname);
    const file = m ? FILES[Number(m[1])] : undefined;
    return file ? new Response(new Blob([file.bytes as BlobPart]), { headers: { 'content-type': file['content-type'] } }) : null;
}
