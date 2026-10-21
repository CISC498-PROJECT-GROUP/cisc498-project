// What each study step cannot work without. Bodies are coerced first (coerce.ts, coerce-doc.ts) and
// then checked here; a failure is a StudyRequestError, which the route answers with 435.

import type { DigestRequest, LinksRequest, PlanRequest, SectionRequest, StudyDocument } from '@canvas-assistant/shared';
import { course, day, digest, isObject, lecture, list, obj, str } from '@/services/study/coerce';
import { links, plan, section } from '@/services/study/coerce-doc';
import { StudyRequestError } from '@/services/study/study-errors';

/** A three-hour lecture's captions run to about 200k characters. */
export const MAX_TRANSCRIPT = 400_000;

/** More lectures than a semester holds is a runaway request. */
export const MAX_LECTURES = 60;

const body = (value: unknown): Record<string, unknown> => {
    if (!isObject(value)) throw new StudyRequestError('Body must be a JSON object.');
    return value;
};

const range = (value: unknown): { from: string; to: string } => {
    const o = obj(value);
    const from = day(o.from);
    const to = day(o.to);
    if (from === '' || to === '' || from > to) throw new StudyRequestError('"range" needs "from" and "to" as YYYY-MM-DD, from on or before to.');
    return { from, to };
};

const digests = (value: unknown) => {
    const out = list(value, digest, MAX_LECTURES);
    if (out.length === 0) throw new StudyRequestError('"digests" must hold at least one lecture digest.');
    return out;
};

export function validateDigest(value: unknown): DigestRequest {
    const o = body(value);
    const ref = lecture(o.lecture);
    const transcript = str(o.transcript, MAX_TRANSCRIPT + 1);
    if (ref === null) throw new StudyRequestError('"lecture" needs an "id".');
    if (transcript.trim() === '') throw new StudyRequestError('"transcript" is empty.');
    if (transcript.length > MAX_TRANSCRIPT) throw new StudyRequestError(`"transcript" is longer than ${MAX_TRANSCRIPT} characters.`);
    return { course: course(o.course), lecture: ref, transcript };
}

export function validatePlan(value: unknown): PlanRequest {
    const o = body(value);
    if (o.kind !== 'topics' && o.kind !== 'study_guide') throw new StudyRequestError('"kind" must be "topics" or "study_guide".');
    const exam = obj(o.exam);
    return { kind: o.kind, course: course(o.course), title: str(o.title, 200) || 'Study Guide', range: range(o.range), exam: { name: str(exam.name, 200), date: str(exam.date, 200), notes: str(exam.notes, 6000) }, digests: digests(o.digests) };
}

export function validateSection(value: unknown): SectionRequest {
    const o = body(value);
    const shaped = plan(o.plan);
    if (shaped.units.length === 0) throw new StudyRequestError('"plan" has no units.');
    const number = str(o.section, 20);
    if (number === '') throw new StudyRequestError('"section" is required.');
    return { course: course(o.course), plan: shaped, section: number, digests: digests(o.digests) };
}

export function validateLinks(value: unknown): LinksRequest {
    const o = body(value);
    const shaped = plan({ units: [o.unit] }).units[0];
    if (!shaped) throw new StudyRequestError('"unit" needs at least one section.');
    const resources = list(o.resources, (r) => (/^https?:\/\//.test(str(r.url)) ? { title: str(r.title, 200), url: str(r.url, 500) } : null), 50);
    return { course: course(o.course), unit: shaped, resources };
}

export function validateRender(value: unknown): StudyDocument {
    const o = body(value);
    if (o.kind !== 'topics' && o.kind !== 'study_guide') throw new StudyRequestError('"kind" must be "topics" or "study_guide".');
    const shaped = plan(o.plan);
    if (shaped.units.length === 0) throw new StudyRequestError('"plan" has no units.');
    return {
        kind: o.kind,
        course: course(o.course),
        range: range(o.range),
        generated: day(o.generated),
        lectures: list(o.lectures, lecture, MAX_LECTURES),
        missing: list(o.missing, lecture, MAX_LECTURES),
        plan: shaped,
        sections: list(o.sections, section, 80),
        links: list(o.links, links, 80).filter((entry) => entry.number !== ''),
    };
}
