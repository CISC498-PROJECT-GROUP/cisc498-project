// WebReg's raw shapes, as its own page and scripts use them (docs/webreg-integration.html). WebReg
// has no public API, so every field is optional: the mappers read what is there and default the rest.

export interface Envelope<T> {
    result?: string;
    messages?: unknown[];
    errors?: unknown[];
    object?: T;
}

export interface RawMeeting {
    days?: string[] | string;
    startTime?: number[] | string;
    endTime?: number[] | string;
    startDate?: string;
    endDate?: string;
    location?: string;
}

/** WebReg's instructor: `descr` is "Last,First". */
export interface RawInstructor {
    descr?: string;
    email?: string;
}

export type RawInstructors = (RawInstructor | string)[];

/** A grading choice: {description: "Standard Grading", value: "SG"}. */
export interface RawGradeOption {
    description?: string;
    value?: string;
}

/** A section that satisfies a required component, as `assoc.LAB` lists it: its id and a one-line
    description that carries the meeting time and seat status —
    "CISC103020L INTRO COMP SCI WITH WEB APPS F 12:40 PM - 1:35 PM (Open Seats)". */
export interface RawAssocItem {
    descr?: string;
    value?: string;
}

/** One section as WebReg describes it — the same object in `var schedule`, a poll's `schedule`, and
    lookupCourseInfo (which adds full/waitlist/status). Shape observed on UD's WebReg, Nov 2026. */
export interface RawSection {
    /** "CISC108010" */
    courseId?: string;
    classSection?: string;
    /** "LEC", "LAB", … */
    type?: string;
    /** The course title, upper case. */
    descr?: string;
    longDescr?: string;
    creditHr?: number | string;
    creditOpt?: (string | number)[] | string | number;
    gradeOption?: RawGradeOption | string;
    gradeOptions?: (RawGradeOption | string)[];
    calendar?: RawMeeting[];
    instructors?: RawInstructors;
    components?: { type?: string; optional?: boolean }[];
    assoc?: Record<string, RawAssocItem[]>;
    /** Registered sections associated with this one (its lab). */
    associates?: string[];
    notes?: string[] | string;
    waitlisted?: boolean;
    dropped?: boolean;
    withdrawn?: boolean;
    withdrawable?: boolean;
    droppable?: boolean;
    full?: boolean;
    waitlistPossible?: boolean;
    waitlistTotal?: number;
    online?: boolean;
    /** lookupCourseInfo's requisite status, e.g. "SATISFIED". */
    status?: string;
}

export type RawScheduleEntry = RawSection;
export type RawSectionInfo = RawSection;

export interface RawSession {
    session?: string;
    descr?: string;
    openEnrollment?: number;
    addWithAppointment?: number;
    endDropAdd?: number;
}

export interface RawTerm {
    strm?: string;
    descr?: string;
    isOpenEnrollment?: boolean;
    isAppointmentPeriod?: boolean;
    isPenaltyPeriod?: boolean;
    isWithdrawPeriod?: boolean;
    sessions?: RawSession[];
}

/** The inline-script vars of /registration/schedule/<strm>. */
export interface RawSchedulePage {
    schedule: RawScheduleEntry[];
    term: RawTerm;
    maxCredits: unknown;
    totalCredits: unknown;
    readOnly: unknown;
    isAddPossible: unknown;
    swapOnly: unknown;
    terms: { strm: string; label: string }[];
}

export interface RawLookupItem {
    label?: string;
    value?: string;
}

export interface RawQueued {
    queueId?: string | number;
    nextPollTime?: number;
}

export interface RawWriteResults {
    successful?: boolean;
    results?: Record<string, boolean>;
    messages?: unknown[];
    errors?: unknown[];
}

export interface RawPoll {
    complete?: boolean;
    nextPollTime?: number;
    results?: RawWriteResults;
    schedule?: RawScheduleEntry[];
}
