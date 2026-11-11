// The stand-in WebReg answers the way the client expects, and refuses what WebReg would. The fixtures
// are stateful, so these run in order against one in-memory schedule.

import { describe, expect, test } from 'bun:test';
import { readVar } from '@/services/webreg/script-vars';
import { CSRF_TOKEN } from '../preview/webreg/page';
import { webregRoute } from '../preview/webreg/routes';

const BASE = 'https://webreg.nss.udel.edu/registration/';

async function call(path: string, body?: unknown, token = CSRF_TOKEN): Promise<Response> {
    const url = new URL(path, BASE);
    const init: RequestInit = body === undefined ? {} : { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', 'x-csrf-token': token } };
    const response = await webregRoute(new Request(url, init), url);
    if (!response) throw new Error(`no route for ${path}`);
    return response;
}

const json = async (path: string, body?: unknown) => (await (await call(path, body)).json()) as { result: string; errors: string[]; object: Record<string, unknown> };

/** Queue a write and poll it to the end, as the client does. */
async function write(kind: string, body: unknown) {
    const queued = await json(`sisqueue/${kind}`, body);
    expect(queued.result).toBe('SUCCESS');
    const id = String(queued.object.queueId);
    expect((await json(`sisqueue/poll?queueId=${id}`)).object.complete).toBe(false);
    const done = (await json(`sisqueue/poll?queueId=${id}`)).object;
    expect(done.complete).toBe(true);
    return done.results as { successful: boolean; messages: string[]; errors: string[]; results: Record<string, boolean> };
}

const opt = (creditHr: string | number, gradeOption = 'SG') => ({ chosenInstructor: null, creditHr, gradeOption });

describe('stand-in WebReg', () => {
    test('/registration/ redirects to the current term; its page carries the CSRF meta and vars', async () => {
        const redirect = await call('');
        expect(redirect.status).toBe(302);
        expect(redirect.headers.get('location')).toBe('/registration/schedule/2273');
        const html = await (await call('schedule/2273')).text();
        expect(html).toMatch(/<meta\s+name="_csrf"\s+content="[^"]+"/);
        expect(html).toContain('<select id="term"');
        const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';
        expect((readVar([script], 'schedule') as unknown[]).length).toBe(5);
        expect(readVar([script], 'maxCredits')).toBe(17);
    });

    test('search lists courses, then a course’s sections', async () => {
        const courses = (await json('lookupCourses/2273/CISC1')).object.items as { value: string }[];
        expect(courses.map((c) => c.value)).toEqual(['CISC108', 'CISC181']);
        const sections = (await json('lookupCourses/2273/CISC108')).object.items as { value: string }[];
        expect(sections.map((s) => s.value)).toContain('CISC108020L');
        const info = (await json('lookupCourseInfo/2273/CISC108010')).object;
        expect(info.components).toEqual([{ type: 'LAB', optional: false }]);
    });

    test('a write without the CSRF token is refused', async () => {
        expect((await call('sisqueue/add', { courses: ['CISC303010'], options: [opt('3')] }, 'wrong')).status).toBe(403);
    });

    test('refuses a missing lab, a conflict, a full section and too many credits', async () => {
        expect((await write('add', { courses: ['CISC108010'], options: [opt('3')], overrides: [], waitlist: false })).errors[0]).toContain('requires a LAB');
        expect((await write('add', { courses: ['CISC181010', 'CISC181020L'], options: [opt('3'), opt(0, 'NON')], overrides: [], waitlist: false })).errors.join(' ')).toContain('Time conflict');
        expect((await write('add', { courses: ['CISC361010'], options: [opt('3')], overrides: [], waitlist: false })).errors[0]).toContain('no waitlist');
        const over = await write('add', { courses: ['CISC303010', 'MATH350010'], options: [opt('3'), opt('3')], overrides: [], waitlist: false });
        expect(over.successful).toBe(false);
        expect(over.errors[0]).toContain('limit');
    });

    test('adds, swaps and drops change the schedule', async () => {
        const added = await write('add', { courses: ['MATH241010'], options: [opt('4')], overrides: [], waitlist: false });
        expect(added).toMatchObject({ successful: true, results: { MATH241010: true } });
        expect(added.messages[0]).toContain('previously taken');
        expect((await json('check/PHYS207010')).object.corequisites).toEqual(['PHYS207021L']);
        const swapped = await write('swap', { coursesIn: ['PHYS207010', 'PHYS207020L'], options: [opt('4'), opt(0, 'NON')], coursesOut: ['PHYS207010'], overrides: [], component: 'LEC' });
        expect(swapped.successful).toBe(true);
        const dropped = await write('drop', { courses: ['MATH241010'], withdraw: false, overrides: [] });
        expect(dropped.successful).toBe(true);
        expect((await write('drop', { courses: ['MATH241010'], withdraw: false, overrides: [] })).successful).toBe(false);
    });
});
