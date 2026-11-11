// Mapping the pieces every WebReg answer shares: meetings (calendar[]), instructors, credit and grade
// options. Tolerant — a missing or malformed field becomes an empty value, never a guess. Pure.

import { parseClock, parseDays } from '@/services/webreg/times';
import type { RawInstructors, RawMeeting, RawSection } from '@/services/webreg/webreg-types';
import type { GradeOption, Meeting } from '@/services/types/webreg';

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** A section's meetings; one with no days or no times (an online section's placeholder) is dropped. */
export function mapMeetings(raw: RawMeeting[] | undefined): Meeting[] {
    const out: Meeting[] = [];
    for (const m of Array.isArray(raw) ? raw : []) {
        const days = parseDays(m?.days);
        const start = parseClock(m?.startTime);
        const end = parseClock(m?.endTime);
        if (!days.length || !start || !end) continue;
        out.push({ days, start, end, location: str(m.location), startDate: str(m.startDate), endDate: str(m.endDate) });
    }
    return out;
}

/** WebReg writes a name "Last,First"; shown "First Last". */
const displayName = (raw: string): string => {
    const [last, first] = raw.split(',').map((part) => part.trim());
    return first ? `${first} ${last}` : raw.trim();
};

export function mapInstructors(raw: RawInstructors | undefined): string[] {
    const names = (Array.isArray(raw) ? raw : []).map((i) => displayName(typeof i === 'string' ? i : (i?.descr ?? '')));
    return [...new Set(names.filter((n) => n && !/^staff$/i.test(n)))];
}

/** creditOpt as a list of choices: [3], ["1","2","3"], "1-3" or 3. */
export function mapCreditOptions(raw: RawSection['creditOpt']): number[] {
    let values: number[] = [];
    if (Array.isArray(raw)) values = raw.map(Number);
    else if (typeof raw === 'number') values = [raw];
    else if (typeof raw === 'string') {
        const range = /^\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*$/.exec(raw);
        values = range ? span(Number(range[1]), Number(range[2])) : [Number(raw)];
    }
    return [...new Set(values.filter((n) => Number.isFinite(n) && n >= 0))].sort((a, b) => a - b);
}

const span = (min: number, max: number): number[] => (max - min > 12 || max < min ? [min] : Array.from({ length: Math.floor(max - min) + 1 }, (_, i) => min + i));

const GRADE_LABELS: Record<string, string> = { SG: 'Standard grading', PFS: 'Pass/fail', AUD: 'Audit', NON: 'No separate grade' };

export const gradeLabel = (value: string): string => GRADE_LABELS[value] ?? value;

export function mapGradeOptions(raw: RawSection['gradeOptions']): GradeOption[] {
    const out: GradeOption[] = [];
    for (const g of Array.isArray(raw) ? raw : []) {
        const value = typeof g === 'string' ? g : g?.value;
        if (!value || out.some((o) => o.value === value)) continue;
        const label = typeof g === 'string' ? null : str(g.description);
        out.push({ value, label: label ?? gradeLabel(value) });
    }
    return out;
}

export const number = (v: unknown): number | null => {
    const n = typeof v === 'string' ? Number(v) : v;
    return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/** "CISC108: INTRO TO COMPUTER SCIENCE I" → the title after the colon, in title case. */
export function courseTitle(label: string): string {
    const title = label.includes(':') ? label.slice(label.indexOf(':') + 1).trim() : label;
    return title === title.toUpperCase()
        ? title
              .toLowerCase()
              .replace(/\b([a-z])/g, (c) => c.toUpperCase())
              .replace(/\b(Ii|Iii|Iv)\b/g, (r) => r.toUpperCase())
              .replace(/(?!^)\b(And|Of|To|In|For|The|On|With)\b/g, (w) => w.toLowerCase())
        : title;
}

export const bool = (v: unknown): boolean => v === true || v === 'true';

export { str };
