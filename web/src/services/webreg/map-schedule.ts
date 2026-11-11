// WebReg's schedule page vars → the registered schedule. The sections are as WebReg lists them; the
// credit total is WebReg's own (totalCredits), not a sum of ours. Pure.

import { bool, courseTitle, gradeLabel, mapInstructors, mapMeetings, number, str } from '@/services/webreg/map-common';
import { courseCode, sectionCode } from '@/services/webreg/section-id';
import type { RawSchedulePage, RawScheduleEntry, RawTerm } from '@/services/webreg/webreg-types';
import type { RegisteredSection, TermInfo, WebregSchedule } from '@/services/types/webreg';

/** "CISC108010" from WebReg's courseId. */
export const sectionIdOf = (raw: RawScheduleEntry): string => (str(raw.courseId) ?? '').replace(/\s|-/g, '').toUpperCase();

/** WebReg says where a section stands with flags, not a status word. */
const statusOf = (raw: RawScheduleEntry): string => (bool(raw.withdrawn) ? 'Withdrawn' : bool(raw.dropped) ? 'Dropped' : bool(raw.waitlisted) ? 'Waitlisted' : 'Enrolled');

export function mapScheduleEntry(raw: RawScheduleEntry): RegisteredSection {
    const id = sectionIdOf(raw);
    const grade = raw.gradeOption;
    const gradeOption = (typeof grade === 'string' ? str(grade) : str(grade?.value)) ?? 'SG';
    const status = statusOf(raw);
    return {
        id,
        code: sectionCode(id),
        course: courseCode(id),
        title: courseTitle(str(raw.descr) ?? ''),
        component: str(raw.type) ?? (id.endsWith('L') ? 'LAB' : 'LEC'),
        credits: number(raw.creditHr) ?? 0,
        gradeOption,
        gradeLabel: (typeof grade === 'object' ? str(grade?.description) : null) ?? gradeLabel(gradeOption),
        meetings: mapMeetings(raw.calendar),
        instructors: mapInstructors(raw.instructors),
        status,
        waitlisted: status === 'Waitlisted',
        // WebReg's schedule doesn't report a waitlist position.
        waitlistPosition: null,
        withdrawable: bool(raw.withdrawable),
    };
}

const date = (ms: unknown): Date | null => {
    const n = number(ms);
    return n === null ? null : new Date(n);
};

export function mapTerm(raw: RawTerm | undefined, strm: string, label: string): TermInfo {
    const session = raw?.sessions?.[0];
    return {
        strm: str(raw?.strm) ?? strm,
        label: str(raw?.descr) ?? label,
        isOpenEnrollment: bool(raw?.isOpenEnrollment),
        isAppointmentPeriod: bool(raw?.isAppointmentPeriod),
        isPenaltyPeriod: bool(raw?.isPenaltyPeriod),
        isWithdrawPeriod: bool(raw?.isWithdrawPeriod),
        windows: { openEnrollment: date(session?.openEnrollment), addWithAppointment: date(session?.addWithAppointment), endDropAdd: date(session?.endDropAdd) },
    };
}

/** The registered sections — a dropped or withdrawn one is history, not the schedule. */
export const mapSections = (raw: RawScheduleEntry[] | undefined): RegisteredSection[] => (Array.isArray(raw) ? raw : []).map(mapScheduleEntry).filter((s) => s.id && s.status !== 'Dropped' && s.status !== 'Withdrawn');

/** The page's vars for term `strm` (the URL it ended on). */
export function mapSchedule(raw: RawSchedulePage, strm: string): WebregSchedule {
    const label = raw.terms.find((t) => t.strm === strm)?.label ?? '';
    const sections = mapSections(raw.schedule);
    return {
        term: mapTerm(raw.term, strm, label),
        terms: raw.terms,
        sections,
        maxCredits: number(raw.maxCredits),
        totalCredits: number(raw.totalCredits) ?? sections.reduce((n, s) => n + (s.waitlisted ? 0 : s.credits), 0),
        readOnly: bool(raw.readOnly),
        isAddPossible: raw.isAddPossible === undefined ? true : bool(raw.isAddPossible),
        swapOnly: bool(raw.swapOnly),
    };
}
