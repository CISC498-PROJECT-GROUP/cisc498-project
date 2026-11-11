// Registration writes — REAL changes to the student's enrollment in UD's student information system.
// Called only from a confirm the student has pressed (components/schedule/review-dialog.tsx); the chat
// assistant never reaches this file.
//
// Each write: open the term's schedule page (the term is WebReg session state), POST the change to
// sisqueue/<kind>, then poll sisqueue/poll every nextPollTime ms until WebReg says complete. The
// result is WebReg's own — per-section results, messages, errors — never assumed.

import { mapSections } from '@/services/webreg/map-schedule';
import { loadSchedule } from '@/services/webreg/schedule-page';
import { sectionCode } from '@/services/webreg/section-id';
import { WebregError, textsOf, webregGet, webregPost } from '@/services/webreg/webreg-api';
import type { RawPoll, RawQueued } from '@/services/webreg/webreg-types';
import type { StepSection, WriteResult, WriteStep } from '@/services/types/webreg';

const POLL_FLOOR_MS = 250;
const POLL_CEILING_MS = 5_000;
const POLL_TIMEOUT_MS = 120_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const pollDelay = (next: unknown): number => Math.min(POLL_CEILING_MS, Math.max(POLL_FLOOR_MS, typeof next === 'number' && Number.isFinite(next) ? next : 1000));

/** One option per course, in order: a credit-bearing section sends its hours as text, a component
    with none (a lab) sends 0 — as WebReg's own page does. */
const option = (s: StepSection) => ({ chosenInstructor: null, creditHr: s.credits > 0 ? String(s.credits) : 0, gradeOption: s.gradeOption });

/** The sisqueue path and body for a step. */
export function writeRequest(step: WriteStep): { path: string; body: unknown } {
    switch (step.kind) {
        case 'add':
            return { path: 'sisqueue/add', body: { courses: step.sections.map((s) => s.id), options: step.sections.map(option), overrides: [], waitlist: step.waitlist } };
        case 'drop':
            return { path: 'sisqueue/drop', body: { courses: step.sections.map((s) => s.id), withdraw: step.withdraw, overrides: [] } };
        case 'swap':
            return { path: 'sisqueue/swap', body: { coursesIn: step.in.map((s) => s.id), options: step.in.map(option), coursesOut: step.out.map((s) => s.id), overrides: [], component: step.component } };
        case 'edit':
            return { path: 'sisqueue/edit', body: { courses: [step.section.id], options: [option(step.section)] } };
    }
}

/** WebReg's results as the site shows them, with the schedule it reports afterwards. Sections WebReg doesn't mention are left out, not guessed. */
export function mapWriteResult(poll: RawPoll | null): WriteResult {
    const raw = poll?.results;
    const results = raw?.results && typeof raw.results === 'object' ? raw.results : {};
    return {
        successful: raw?.successful === true,
        sections: Object.entries(results).map(([id, ok]) => ({ id, code: sectionCode(id), ok: ok === true })),
        messages: textsOf(raw?.messages),
        errors: textsOf(raw?.errors),
        schedule: Array.isArray(poll?.schedule) ? mapSections(poll.schedule) : null,
    };
}

async function pollUntilDone(queueId: string, firstDelay: unknown): Promise<WriteResult> {
    const started = Date.now();
    let delay = pollDelay(firstDelay);
    while (Date.now() - started < POLL_TIMEOUT_MS) {
        await wait(delay);
        const poll = await webregGet<RawPoll | null>(`sisqueue/poll?queueId=${encodeURIComponent(queueId)}`);
        if (poll?.complete) return mapWriteResult(poll);
        delay = pollDelay(poll?.nextPollTime);
    }
    throw new WebregError('WebReg is still working on this change. Check your schedule in a minute before trying again — it may have gone through.');
}

/** Make one write in term `strm` and wait for WebReg's answer. */
export async function runWrite(strm: string, step: WriteStep): Promise<WriteResult> {
    await loadSchedule(strm);
    const { path, body } = writeRequest(step);
    const queued = await webregPost<RawQueued | null>(path, body);
    if (queued?.queueId === undefined || queued.queueId === null) throw new WebregError("WebReg didn't queue the change — nothing was sent to registration.");
    return pollUntilDone(String(queued.queueId), queued.nextPollTime);
}
