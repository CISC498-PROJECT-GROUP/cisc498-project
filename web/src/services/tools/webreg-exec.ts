// get_registration and search_classes: WebReg for the model, read only — the same client the
// Schedule page uses (services/webreg/), never its writes. A term comes as WebReg's code ("2273") or
// a name ("Spring 2027"); none means the term WebReg opens by default.

import { courseSections, searchCourses } from '@/services/webreg/lookups';
import { loadSchedule } from '@/services/webreg/schedule-page';
import { seasonOf } from '@/services/webreg/term-match';
import { formatMeetings } from '@/services/webreg/times';
import type { SectionInfo, WebregSchedule } from '@/services/types/webreg';
import { clip, need, optional, ToolInputError, type ToolInput, type ToolOutput } from '@/services/tools/tool-helpers';

/** Sections described in full per search; a big course has dozens. */
const MAX_SECTIONS = 15;

async function termCode(raw: string | undefined): Promise<string | null> {
    if (!raw) return null;
    if (/^\d{4}$/.test(raw)) return raw;
    const wanted = seasonOf(raw);
    const { terms } = await loadSchedule(null);
    const found = terms.find((t) => {
        const s = seasonOf(t.label);
        return wanted !== null && s !== null && s.season === wanted.season && s.year === wanted.year;
    });
    if (!found) throw new ToolInputError(`WebReg offers ${terms.map((t) => `${t.label} (${t.strm})`).join(', ')} — not "${raw}".`);
    return found.strm;
}

const day = (d: Date | null): string => (d ? d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'not given');

function scheduleText(s: WebregSchedule): string {
    const t = s.term;
    const lines = [
        `WebReg, ${t.label} (term ${t.strm}):`,
        `Registered credits: ${s.totalCredits}${s.maxCredits !== null ? ` of a ${s.maxCredits}-credit limit` : ''}`,
        `Windows: open enrollment ${day(t.windows.openEnrollment)} · add with appointment ${day(t.windows.addWithAppointment)} · last day of drop/add ${day(t.windows.endDropAdd)}`,
        `Now: ${[t.isAppointmentPeriod && 'appointment period', t.isOpenEnrollment && 'open enrollment', t.isPenaltyPeriod && 'penalty period', t.isWithdrawPeriod && 'withdrawal period'].filter(Boolean).join(', ') || 'no registration period flagged'}${s.readOnly ? ' · registration is read-only' : ''}`,
        '',
        s.sections.length ? 'Sections:' : 'No sections registered for this term.',
        ...s.sections.map(
            (c) =>
                `- ${c.code} ${c.title} (${c.component}) · ${c.credits} cr · ${c.gradeLabel} · ${c.status} · ${formatMeetings(c.meetings)}${c.meetings[0]?.location ? ` · ${c.meetings[0].location}` : ''}${c.instructors.length ? ` · ${c.instructors.join(', ')}` : ''}`,
        ),
        '',
        `Other terms in WebReg: ${s.terms.map((x) => `${x.label} (${x.strm})`).join(', ')}`,
    ];
    return lines.join('\n');
}

export async function registration(input: ToolInput): Promise<ToolOutput> {
    return clip(scheduleText(await loadSchedule(await termCode(optional(input, 'term')))));
}

function sectionText(s: SectionInfo): string {
    const seats = s.full ? (s.waitlistPossible ? `full, waitlist open (${s.waitlistTotal} waiting)` : 'full, no waitlist') : 'open seats';
    const credits = s.creditOptions.length > 1 ? `${s.creditOptions[0]}–${s.creditOptions.at(-1)} cr` : `${s.creditOptions[0] ?? '?'} cr`;
    const labs = s.required.map((r) => `requires a ${r.type}${r.optional ? ' (optional)' : ''}: ${r.candidates.map((c) => `${c.code} ${formatMeetings(c.meetings)}${c.full ? ' (full)' : ''}`).join('; ')}`);
    return [
        `- ${s.code} ${s.title} · ${formatMeetings(s.meetings)}${s.meetings[0]?.location ? ` · ${s.meetings[0].location}` : ''} · ${s.instructors.join(', ') || 'instructor TBA'} · ${credits} · ${seats}`,
        ...labs.map((l) => `  ${l}`),
        ...s.notes.map((n) => `  note: ${n}`),
    ].join('\n');
}

export async function searchClasses(input: ToolInput): Promise<ToolOutput> {
    const query = need(input, 'query');
    const strm = (await termCode(optional(input, 'term'))) ?? (await loadSchedule(null)).term.strm;
    const found = await searchCourses(strm, query);
    if (found.kind === 'courses') {
        if (found.courses.length === 0) return `WebReg has no courses matching "${query}" in term ${strm}.`;
        return clip([`WebReg courses matching "${query}" (term ${strm}) — search a whole course code for its sections:`, ...found.courses.map((c) => `- ${c.code} ${c.title}`)].join('\n'));
    }
    const sections = await courseSections(strm, found.courseId);
    if (sections.length === 0) return `WebReg lists no lecture sections for ${query} in term ${strm}.`;
    const shown = sections.slice(0, MAX_SECTIONS);
    const head = `${shown[0]!.course} ${shown[0]!.title} in WebReg (term ${strm}) — ${sections.length} section${sections.length === 1 ? '' : 's'}${sections.length > shown.length ? `, first ${shown.length} shown` : ''}:`;
    const about = shown[0]!.description ? `\n${shown[0]!.description}` : '';
    return clip(`${head}${about}\n${shown.map(sectionText).join('\n')}`);
}
