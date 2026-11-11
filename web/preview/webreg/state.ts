// The stand-in WebReg's state: three invented terms (windows set relative to when the stand-in
// starts, so the preview always shows Spring in its appointment period), the catalog per term, and
// the student's registered sections per term — in memory, so add, drop and swap change only this.
// Like WebReg, the term the student last opened is session state, and writes act on it. Never bundled.

import { type FakeCourse, type FakeSection } from './catalog';
import { CISC } from './courses-cisc';
import { OTHER } from './courses-other';

const DAY = 86_400_000;
const at = (days: number): number => Math.round((Date.now() + days * DAY) / 3_600_000) * 3_600_000;

export interface FakeTerm {
    strm: string;
    descr: string;
    maxCredits: number;
    isOpenEnrollment: boolean;
    isAppointmentPeriod: boolean;
    isPenaltyPeriod: boolean;
    isWithdrawPeriod: boolean;
    isAddPossible: boolean;
    sessions: { session: string; descr: string; openEnrollment: number; addWithAppointment: number; endDropAdd: number }[];
}

const session = (appointment: number, open: number, end: number) => [{ session: '1', descr: 'Regular Academic Session', addWithAppointment: at(appointment), openEnrollment: at(open), endDropAdd: at(end) }];

export const TERMS: FakeTerm[] = [
    { strm: '2268', descr: '2026 Fall Semester', maxCredits: 17, isOpenEnrollment: false, isAppointmentPeriod: false, isPenaltyPeriod: false, isWithdrawPeriod: true, isAddPossible: false, sessions: session(-220, -200, -60) },
    { strm: '2271', descr: '2027 Winter Session', maxCredits: 7, isOpenEnrollment: true, isAppointmentPeriod: false, isPenaltyPeriod: false, isWithdrawPeriod: false, isAddPossible: true, sessions: session(-12, -9, 60) },
    { strm: '2273', descr: '2027 Spring Semester', maxCredits: 17, isOpenEnrollment: false, isAppointmentPeriod: true, isPenaltyPeriod: false, isWithdrawPeriod: false, isAddPossible: true, sessions: session(-2, 12, 100) },
];

/** Where /registration/ sends the student: the term registration is open for. */
export const CURRENT_STRM = '2273';

export interface Enrollment {
    id: string;
    credits: number;
    gradeOption: string;
    status: 'Enrolled' | 'Waitlisted';
    waitlistPosition: number | null;
}

const enrolled = (id: string, credits: number, gradeOption = 'SG'): Enrollment => ({ id, credits, gradeOption, status: 'Enrolled', waitlistPosition: null });

export const REGISTERED: Record<string, Enrollment[]> = {
    '2268': [enrolled('CISC181011', 3), enrolled('CISC181022L', 0, 'NON'), enrolled('MATH242011', 4), enrolled('ENGL110011', 3), enrolled('CISC210010', 3)],
    '2271': [],
    '2273': [enrolled('CISC220010', 3), enrolled('MATH210010', 3), enrolled('ENGL312011', 3), enrolled('PHYS207010', 4), enrolled('PHYS207021L', 0, 'NON')],
};

/** The term the student last opened — WebReg keeps it in the session, and sisqueue acts on it. */
export const webregSession = { strm: CURRENT_STRM };

export const termOf = (strm: string): FakeTerm | undefined => TERMS.find((t) => t.strm === strm);

const offered = (course: FakeCourse, strm: string): boolean => (course.terms ?? ['2268', '2273']).includes(strm);

export const coursesIn = (strm: string): FakeCourse[] => [...CISC, ...OTHER].filter((c) => offered(c, strm));

export interface Found {
    course: FakeCourse;
    section: FakeSection;
}

export function findSection(strm: string, id: string): Found | null {
    for (const course of coursesIn(strm)) {
        const section = course.sections.find((s) => s.id === id);
        if (section) return { course, section };
    }
    return null;
}

/** The lecture a lab belongs to, among the student's registered sections. */
export const lectureOf = (strm: string, labId: string): string | undefined => REGISTERED[strm]?.find((e) => findSection(strm, e.id)?.section.labs.includes(labId))?.id;

export const isFull = (s: FakeSection): boolean => s.enrolled >= s.capacity;

export const code = (id: string): string => id.replace(/^([A-Z]+)(\d{3})(\d{3}L?)$/, '$1 $2-$3');
