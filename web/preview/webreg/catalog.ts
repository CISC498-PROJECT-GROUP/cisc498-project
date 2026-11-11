// The stand-in WebReg's catalog: the shape of an invented course and section, and helpers that keep
// the fixture lists short. Every course, section, instructor, room and time here is made up. Never
// bundled.

export type Hm = [number, number];

export interface FakeMeeting {
    days: string[];
    startTime: Hm;
    endTime: Hm;
    location: string;
    startDate: string;
    endDate: string;
}

export interface FakeSection {
    /** "CISC108010" */
    id: string;
    component: 'LEC' | 'LAB' | 'SEM';
    meetings: FakeMeeting[];
    instructors: string[];
    capacity: number;
    enrolled: number;
    waitlistPossible: boolean;
    waitlistTotal: number;
    notes: string[];
    /** The labs a student must pair with this lecture, when it has any. */
    labs: string[];
}

export interface FakeCourse {
    /** "CISC108" */
    id: string;
    title: string;
    creditOpt: string[];
    gradeOptions: string[];
    description: string;
    sections: FakeSection[];
    /** The stand-in student took it before: adding it succeeds with WebReg's repeat-policy warning. */
    takenBefore?: boolean;
    /** Terms it runs in; Fall and Spring when absent (Winter is a short session). */
    terms?: string[];
}

const SPRING = { startDate: '02/08/2027', endDate: '05/18/2027' };

const time = (text: string): Hm => {
    const [h, m] = text.split(':').map(Number);
    return [h, m];
};

/** "TR 15:30-16:45 Gore Hall 104" → a meeting in the term's regular session. */
export function meet(spec: string): FakeMeeting {
    const [days, span, ...room] = spec.split(' ');
    const [start, end] = span.split('-');
    return { days: days.split(''), startTime: time(start), endTime: time(end), location: room.join(' '), ...SPRING };
}

interface SectionSpec {
    meets?: string[];
    who?: string[];
    cap?: number;
    taken?: number;
    waitlist?: boolean;
    waiting?: number;
    notes?: string[];
    labs?: string[];
}

export function lec(id: string, spec: SectionSpec): FakeSection {
    return {
        id,
        component: 'LEC',
        meetings: (spec.meets ?? []).map(meet),
        instructors: spec.who ?? [],
        capacity: spec.cap ?? 40,
        enrolled: spec.taken ?? 22,
        waitlistPossible: spec.waitlist ?? false,
        waitlistTotal: spec.waiting ?? 0,
        notes: spec.notes ?? [],
        labs: spec.labs ?? [],
    };
}

export const lab = (id: string, spec: SectionSpec): FakeSection => ({ ...lec(id, { cap: 24, taken: 15, ...spec }), component: 'LAB' });

export const course = (id: string, title: string, credits: string[], description: string, sections: FakeSection[], extra: Partial<FakeCourse> = {}): FakeCourse => ({
    id,
    title,
    creditOpt: credits,
    gradeOptions: ['SG', 'PFS', 'AUD'],
    description,
    sections,
    ...extra,
});
