// The stand-in's registration rules — the refusals a student meets in WebReg: the add period over,
// a time conflict, more than the credit limit, a full section with no waitlist, a lecture without its
// required lab, credits or grading the course doesn't offer. An add is all or nothing, like WebReg's.
// Never bundled.

import type { FakeMeeting } from './catalog';
import { code, findSection, isFull, termOf, type Enrollment } from './state';

export interface RawOption {
    creditHr?: string | number;
    gradeOption?: string;
}

export interface Checked {
    errors: string[];
    messages: string[];
    added: Enrollment[];
}

const minutes = ([h, m]: [number, number]) => h * 60 + m;
const clash = (a: FakeMeeting, b: FakeMeeting) => a.days.some((d) => b.days.includes(d)) && minutes(a.startTime) < minutes(b.endTime) && minutes(b.startTime) < minutes(a.endTime);
const fmt = ([h, m]: [number, number]) => `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;

function conflicts(strm: string, ids: string[], keep: Enrollment[]): string[] {
    const errors: string[] = [];
    const placed: { id: string; meetings: FakeMeeting[] }[] = keep.map((e) => ({ id: e.id, meetings: findSection(strm, e.id)?.section.meetings ?? [] }));
    for (const id of ids) {
        const meetings = findSection(strm, id)?.section.meetings ?? [];
        for (const other of placed) {
            const hit = meetings.find((m) => other.meetings.some((o) => clash(m, o)));
            if (hit) errors.push(`Time conflict: ${code(id)} (${hit.days.join('')} ${fmt(hit.startTime)}) overlaps ${code(other.id)}.`);
        }
        placed.push({ id, meetings });
    }
    return errors;
}

/** An option's credit hours, checked against the course's choices. */
function credits(option: RawOption | undefined, allowed: string[], lab: boolean): number | null {
    if (lab) return 0;
    const n = Number(option?.creditHr ?? allowed[0]);
    return allowed.map(Number).includes(n) ? n : null;
}

export function checkAdd(strm: string, ids: string[], options: RawOption[], waitlist: boolean, keep: Enrollment[]): Checked {
    const term = termOf(strm);
    const out: Checked = { errors: [], messages: [], added: [] };
    if (!term) return { ...out, errors: ['That term is not available for registration.'] };
    if (!term.isAddPossible) return { ...out, errors: [`The add period for the ${term.descr} has ended. You can no longer add classes for this term.`] };
    const kept = new Set(keep.map((e) => e.id));
    ids.forEach((id, i) => {
        const found = findSection(strm, id);
        if (!found) return out.errors.push(`${code(id)} is not offered in the ${term.descr}.`);
        const { course, section } = found;
        const lab = section.component === 'LAB';
        if (kept.has(id)) return out.errors.push(`You are already registered for ${code(id)}.`);
        if (section.labs.length && !ids.some((other) => section.labs.includes(other))) out.errors.push(`${code(id)} requires a LAB section. Choose one of: ${section.labs.map(code).join(', ')}.`);
        if (lab && !ids.some((o) => findSection(strm, o)?.section.labs.includes(id)) && ![...kept].some((o) => findSection(strm, o)?.section.labs.includes(id))) out.errors.push(`${code(id)} is a lab — add it together with its lecture.`);
        const hours = credits(options[i], course.creditOpt, lab);
        if (hours === null) out.errors.push(`${code(id)} can't be taken for ${options[i]?.creditHr} credits. Allowed: ${course.creditOpt.join(', ')}.`);
        const grade = options[i]?.gradeOption ?? (lab ? 'NON' : 'SG');
        if (!lab && !course.gradeOptions.includes(grade)) out.errors.push(`${code(id)} doesn't offer the grading option ${grade}.`);
        let status: Enrollment['status'] = 'Enrolled';
        if (isFull(section)) {
            if (waitlist && section.waitlistPossible) status = 'Waitlisted';
            else out.errors.push(section.waitlistPossible ? `${code(id)} is full. Choose the waitlist to be added to it.` : `${code(id)} is full and has no waitlist.`);
        }
        if (course.takenBefore && !lab) out.messages.push(`${code(id)}: Course previously taken and may be subject to institutional repeat policy.`);
        if (status === 'Waitlisted') out.messages.push(`${code(id)}: added to the waitlist at position ${section.waitlistTotal + 1}.`);
        out.added.push({ id, credits: hours ?? 0, gradeOption: lab ? 'NON' : grade, status, waitlistPosition: status === 'Waitlisted' ? section.waitlistTotal + 1 : null });
    });
    out.errors.push(...conflicts(strm, ids, keep));
    const total = [...keep, ...out.added].filter((e) => e.status === 'Enrolled').reduce((n, e) => n + e.credits, 0);
    if (total > term.maxCredits) out.errors.push(`This would bring you to ${total} credits. Your limit for the ${term.descr} is ${term.maxCredits}.`);
    return out;
}

/** Which of `ids` may be edited to these options. */
export function checkEdit(strm: string, ids: string[], options: RawOption[], registered: Enrollment[]): string[] {
    const errors: string[] = [];
    ids.forEach((id, i) => {
        const found = findSection(strm, id);
        if (!found || !registered.some((e) => e.id === id)) return errors.push(`You are not registered for ${code(id)}.`);
        if (credits(options[i], found.course.creditOpt, found.section.component === 'LAB') === null) errors.push(`${code(id)} can't be taken for ${options[i]?.creditHr} credits.`);
        if (found.section.component !== 'LAB' && !found.course.gradeOptions.includes(options[i]?.gradeOption ?? '')) errors.push(`${code(id)} doesn't offer that grading option.`);
    });
    return errors;
}
