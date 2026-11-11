/* View-models for the schedule builder, mapped from WebReg's answers by services/webreg/*. Every
   value is WebReg's own; the only things computed here are sums, overlaps and display strings. A
   planned section is a snapshot of WebReg's section info, kept as a draft in the student's browser
   until they register it. */

/** WebReg's day letters: R is Thursday, U is Sunday. */
export type Day = 'M' | 'T' | 'W' | 'R' | 'F' | 'S' | 'U';

/** [hour, minute], 24-hour. */
export type Clock = [number, number];

export interface Meeting {
    days: Day[];
    start: Clock;
    end: Clock;
    location: string | null;
    /** MM/DD/YYYY as WebReg gives it, or null. A 7-week section meets only between these. */
    startDate: string | null;
    endDate: string | null;
}

export interface TermOption {
    strm: string;
    /** "2027 Spring Semester" */
    label: string;
}

export interface TermWindows {
    openEnrollment: Date | null;
    addWithAppointment: Date | null;
    endDropAdd: Date | null;
}

export interface TermInfo {
    strm: string;
    label: string;
    isOpenEnrollment: boolean;
    isAppointmentPeriod: boolean;
    isPenaltyPeriod: boolean;
    isWithdrawPeriod: boolean;
    /** The regular session's windows (the first session WebReg lists). */
    windows: TermWindows;
}

export interface GradeOption {
    value: string;
    label: string;
}

export interface RegisteredSection {
    /** "CISC108010" */
    id: string;
    /** "CISC 108-010" */
    code: string;
    /** "CISC 108" */
    course: string;
    title: string;
    component: string;
    credits: number;
    gradeOption: string;
    gradeLabel: string;
    meetings: Meeting[];
    instructors: string[];
    /** WebReg's status, e.g. "Enrolled" or "Waitlisted". */
    status: string;
    waitlisted: boolean;
    waitlistPosition: number | null;
    withdrawable: boolean;
}

export interface WebregSchedule {
    term: TermInfo;
    terms: TermOption[];
    sections: RegisteredSection[];
    maxCredits: number | null;
    totalCredits: number;
    readOnly: boolean;
    isAddPossible: boolean;
    swapOnly: boolean;
}

export interface CourseHit {
    /** "CISC108" */
    id: string;
    /** "CISC 108" */
    code: string;
    title: string;
}

export interface SectionHit {
    id: string;
    code: string;
    /** WebReg's own label after the id, e.g. "Open Seats". */
    status: string;
    lab: boolean;
}

export type SearchResult = { kind: 'courses'; courses: CourseHit[] } | { kind: 'sections'; courseId: string; sections: SectionHit[] };

/** A section that satisfies a required component, as WebReg lists it under `assoc`. */
export interface ComponentSection {
    id: string;
    code: string;
    meetings: Meeting[];
    instructors: string[];
    full: boolean;
    seats: Seats;
}

export interface RequiredComponent {
    /** "LAB" */
    type: string;
    optional: boolean;
    candidates: ComponentSection[];
}

export interface Seats {
    open: number | null;
    capacity: number | null;
}

export interface SectionInfo {
    id: string;
    code: string;
    course: string;
    title: string;
    component: string;
    /** The credit hours a student may choose, ascending; one value for a fixed-credit course. */
    creditOptions: number[];
    gradeOptions: GradeOption[];
    meetings: Meeting[];
    instructors: string[];
    full: boolean;
    seats: Seats;
    waitlistPossible: boolean;
    waitlistTotal: number;
    required: RequiredComponent[];
    notes: string[];
    description: string;
    status: string;
}

export type * from '@/services/types/webreg-plan';
