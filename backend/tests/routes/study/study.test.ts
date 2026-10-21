// Route tests for the study pipeline. fetch is stubbed, so the SDK's request is intercepted before it
// leaves the process and nothing reaches the Anthropic API. What matters: each step sends a schema
// for structured output, the model's quotes are checked against their source, and every kind of
// failure keeps its own status (435 bad request, 503 not set up, 500 broken).

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { Hono } from 'hono';
import { router_study } from '@/routes/study/study';
import { app_env, DEFAULT_STUDY_MODEL } from '@/services/common/svc-env';

const real_fetch = globalThis.fetch;
const real_key = app_env.anthropic_api_key;
const app = new Hono().route('/study', router_study);

let sent: Record<string, unknown> | null = null;

const reply = (json: unknown, stop_reason = 'end_turn', status = 200) => {
    const body =
        status === 200
            ? { id: 'msg_test', type: 'message', role: 'assistant', model: DEFAULT_STUDY_MODEL, content: [{ type: 'text', text: JSON.stringify(json) }], stop_reason, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 5 } }
            : json;
    globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
        sent = JSON.parse(String(init?.body ?? 'null'));
        return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;
};

const post = (path: string, payload: unknown) => app.request(`/study${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: typeof payload === 'string' ? payload : JSON.stringify(payload) });

const LECTURE = { id: '1_a', title: 'Midterm Review', date: '2026-09-16', minutes: 66 };
const DIGEST_BODY = {
    summary: 's',
    topics: [],
    definitions: [],
    formulas: [],
    examples: [],
    quotes: [
        { text: 'Trees are not on the midterm.', about: 'scope', kind: 'exam' },
        { text: 'Graphs are worth half the exam.', about: 'invented', kind: 'exam' },
    ],
    exam_notes: [],
    traps: [],
    skipped: [],
};

beforeEach(() => {
    sent = null;
    app_env.anthropic_api_key = 'sk-test';
});

afterEach(() => {
    globalThis.fetch = real_fetch;
    app_env.anthropic_api_key = real_key;
});

describe('POST /study/digest', () => {
    it('asks for structured output and keeps only quotes found in the transcript', async () => {
        reply(DIGEST_BODY);
        const res = await post('/digest', { course: { code: 'CISC220', name: 'Data Structures', instructor: '' }, lecture: LECTURE, transcript: 'okay so trees are not on the midterm and that is final' });
        expect(res.status).toBe(200);
        const data = ((await res.json()) as { data: { lecture: unknown; quotes: { text: string }[] } }).data;
        expect(data.lecture).toEqual(LECTURE);
        expect(data.quotes.map((q) => q.text)).toEqual(['Trees are not on the midterm.']);
        expect(sent?.model).toBe(app_env.study_model);
        expect((sent?.output_config as { format: { type: string } }).format.type).toBe('json_schema');
        expect(sent?.fallbacks).toBe('default');
    });

    it('answers 435 for a bad body, 503 without a key, 500 for a refusal', async () => {
        expect((await post('/digest', 'nope')).status).toBe(435);
        expect((await post('/digest', { lecture: LECTURE, transcript: '' })).status).toBe(435);
        app_env.anthropic_api_key = '';
        expect((await post('/digest', { lecture: LECTURE, transcript: 'words here' })).status).toBe(503);
        app_env.anthropic_api_key = 'sk-test';
        reply({}, 'refusal');
        expect((await post('/digest', { lecture: LECTURE, transcript: 'words here' })).status).toBe(500);
    });
});

describe('POST /study/plan', () => {
    const digest = { lecture: LECTURE, ...DIGEST_BODY, quotes: [DIGEST_BODY.quotes[0]] };
    const request = (kind: string) => ({ kind, course: { code: 'C' }, title: 'Midterm Guide', range: { from: '2026-08-26', to: '2026-09-16' }, exam: {}, digests: [digest] });
    const plan = {
        title: 'Midterm\nGuide',
        subtitle: 's',
        chips: [],
        units: [
            {
                number: '',
                title: 'Basics',
                tagline: 't',
                lecture_ids: ['1_a', '1_zz'],
                sections: [
                    { number: '9.9', title: 'A', focus: 'f', points: ['p'], lecture_ids: ['1_a'] },
                    { number: '9.9', title: 'B', focus: 'f', points: [], lecture_ids: [] },
                ],
            },
        ],
        overview: {
            scope: 'x',
            said: [
                { when: 'Sep 16', quote: 'Trees are not on the midterm.' },
                { when: 'Sep 16', quote: 'Everything is on the midterm.' },
            ],
            rules: [],
            priorities: [
                { what: 'Trees', words: '"trees are not on the midterm"' },
                { what: 'X', words: '"something never said here"' },
            ],
            not_tested: [],
            maybe_not: '',
        },
        cheat: { title: 'Review', subtitle: '', tables: [], traps: [], advice: { when: 'Sep 16', quote: 'You will all do great on this.' }, plan: [] },
    };

    it('renumbers sections, drops unknown lecture ids, and checks every quote against the digests', async () => {
        reply(plan);
        const data = ((await (await post('/plan', request('study_guide'))).json()) as { data: typeof plan }).data;
        expect(data.units[0]!.number).toBe('1');
        expect(data.units[0]!.sections.map((s) => s.number)).toEqual(['1.1', '1.2']);
        expect(data.units[0]!.lecture_ids).toEqual(['1_a']);
        expect(data.overview!.said.map((s) => s.quote)).toEqual(['Trees are not on the midterm.']);
        expect(data.overview!.priorities.map((p) => p.what)).toEqual(['Trees']);
        expect(data.cheat!.advice).toBeNull();
    });

    it('returns no overview or review sheet for a topics outline', async () => {
        reply(plan);
        const data = ((await (await post('/plan', request('topics'))).json()) as { data: typeof plan }).data;
        expect(data.overview).toBeNull();
        expect(data.cheat).toBeNull();
    });

    it('answers 435 for an unknown kind or a reversed range', async () => {
        expect((await post('/plan', request('poster'))).status).toBe(435);
        expect((await post('/plan', { ...request('topics'), range: { from: '2026-09-16', to: '2026-08-26' } })).status).toBe(435);
    });
});

describe('POST /study/section', () => {
    it('answers 435 for a section the plan does not have', async () => {
        const plan = { units: [{ number: '1', title: 'U', sections: [{ number: '1.1', title: 'S' }] }] };
        expect((await post('/section', { plan, section: '4.2', digests: [{ lecture: LECTURE }] })).status).toBe(435);
    });
});
