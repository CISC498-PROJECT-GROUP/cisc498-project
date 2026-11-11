// The stand-in's sisqueue: add, drop, swap and edit act on the term the student last opened, and
// answer like WebReg's — a queueId to poll. The change is worked out at once; the first poll says
// complete:false, the next one gives the results and the schedule afterwards. Only the in-memory
// invented schedule changes. Never bundled.

import { checkAdd, checkEdit, type RawOption } from './checks';
import { envelope, failure, scheduleEntry } from './shapes';
import { code, findSection, lectureOf, REGISTERED, termOf, webregSession, type Enrollment } from './state';

interface Outcome {
    successful: boolean;
    results: Record<string, boolean>;
    messages: string[];
    errors: string[];
}

interface Body {
    courses?: string[];
    coursesIn?: string[];
    coursesOut?: string[];
    options?: RawOption[];
    waitlist?: boolean;
    withdraw?: boolean;
}

const queue = new Map<string, { strm: string; polls: number; outcome: Outcome }>();
let nextId = 1;

const all = (ids: string[], ok: boolean) => Object.fromEntries(ids.map((id) => [id, ok]));

/** A drop takes the section's lab (or a lab's lecture) with it, as WebReg's check says. */
function withCoreqs(strm: string, ids: string[]): string[] {
    const out = new Set(ids);
    for (const id of ids) {
        for (const lab of findSection(strm, id)?.section.labs ?? []) if (REGISTERED[strm]?.some((e) => e.id === lab)) out.add(lab);
        const lecture = lectureOf(strm, id);
        if (lecture) out.add(lecture);
    }
    return [...out];
}

function add(strm: string, body: Body): Outcome {
    const ids = (body.courses ?? []).map(String);
    const checked = checkAdd(strm, ids, body.options ?? [], body.waitlist === true, REGISTERED[strm]);
    if (checked.errors.length) return { successful: false, results: all(ids, false), messages: [], errors: checked.errors };
    REGISTERED[strm].push(...checked.added);
    return { successful: true, results: all(ids, true), messages: checked.messages, errors: [] };
}

function drop(strm: string, body: Body): Outcome {
    const asked = (body.courses ?? []).map(String);
    const missing = asked.filter((id) => !REGISTERED[strm].some((e) => e.id === id));
    if (missing.length) return { successful: false, results: all(asked, false), messages: [], errors: missing.map((id) => `You are not registered for ${code(id)}.`) };
    const term = termOf(strm);
    if (term?.isWithdrawPeriod && body.withdraw !== true) return { successful: false, results: all(asked, false), messages: [], errors: [`The drop period for the ${term.descr} has ended. These sections can only be withdrawn.`] };
    const ids = withCoreqs(strm, asked);
    REGISTERED[strm] = REGISTERED[strm].filter((e) => !ids.includes(e.id));
    const messages = ids.filter((id) => !asked.includes(id)).map((id) => `${code(id)} was dropped with ${code(asked[0])}.`);
    if (body.withdraw) messages.push('Withdrawn. A W will appear on your transcript for these sections.');
    return { successful: true, results: all(ids, true), messages, errors: [] };
}

function swap(strm: string, body: Body): Outcome {
    const inIds = (body.coursesIn ?? []).map(String);
    const outIds = withCoreqs(strm, (body.coursesOut ?? []).map(String));
    const ids = [...outIds, ...inIds];
    const missing = outIds.filter((id) => !REGISTERED[strm].some((e) => e.id === id));
    if (missing.length) return { successful: false, results: all(ids, false), messages: [], errors: missing.map((id) => `You are not registered for ${code(id)}, so it can't be swapped out.`) };
    const keep: Enrollment[] = REGISTERED[strm].filter((e) => !outIds.includes(e.id));
    const checked = checkAdd(strm, inIds, body.options ?? [], false, keep);
    if (checked.errors.length) return { successful: false, results: all(ids, false), messages: [`Your registration in ${outIds.map(code).join(', ')} was kept.`], errors: checked.errors };
    REGISTERED[strm] = [...keep, ...checked.added];
    return { successful: true, results: all(ids, true), messages: [`Swapped ${outIds.map(code).join(', ')} for ${inIds.map(code).join(', ')}.`, ...checked.messages], errors: [] };
}

function edit(strm: string, body: Body): Outcome {
    const ids = (body.courses ?? []).map(String);
    const options = body.options ?? [];
    const errors = checkEdit(strm, ids, options, REGISTERED[strm]);
    if (errors.length) return { successful: false, results: all(ids, false), messages: [], errors };
    REGISTERED[strm] = REGISTERED[strm].map((e) => {
        const i = ids.indexOf(e.id);
        return i === -1 || e.id.endsWith('L') ? e : { ...e, credits: Number(options[i].creditHr), gradeOption: String(options[i].gradeOption) };
    });
    return { successful: true, results: all(ids, true), messages: ['Your changes were saved.'], errors: [] };
}

const WRITES: Record<string, (strm: string, body: Body) => Outcome> = { add, drop, swap, edit };

export async function sisqueueWrite(kind: string, req: Request): Promise<Response> {
    const write = WRITES[kind];
    const body = (await req.json().catch(() => null)) as Body | null;
    if (!write || !body) return failure(['The request could not be read.'], 400);
    const strm = webregSession.strm;
    REGISTERED[strm] ??= [];
    const queueId = `Q${Date.now().toString(36)}${nextId++}`;
    queue.set(queueId, { strm, polls: 0, outcome: write(strm, body) });
    return envelope({ queueId, nextPollTime: 400 });
}

export function sisqueuePoll(url: URL): Response {
    const queued = queue.get(url.searchParams.get('queueId') ?? '');
    if (!queued) return failure(['That request is no longer in the queue.']);
    queued.polls++;
    if (queued.polls < 2) return envelope({ complete: false, nextPollTime: 400 });
    queue.delete(url.searchParams.get('queueId') ?? '');
    return envelope({ complete: true, results: queued.outcome, schedule: REGISTERED[queued.strm].map((e) => scheduleEntry(queued.strm, e)) });
}
