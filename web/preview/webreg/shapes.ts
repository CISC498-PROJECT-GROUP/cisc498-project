// The stand-in's fixtures in WebReg's own JSON shapes — field for field the shape observed on UD's
// WebReg in November 2026 (docs/webreg-integration.html): one section object serves `var schedule`,
// a poll's `schedule` and lookupCourseInfo; a lookupCourses item; the {result, messages, errors,
// object} envelope. The values are invented. Never bundled.

import type { FakeCourse, FakeSection } from './catalog';
import { findSection, isFull, type Enrollment } from './state';

const GRADE_LABELS: Record<string, string> = { SG: 'Standard Grading', PFS: 'Pass/Fail Student Option', AUD: 'Audit', NON: 'No Grade' };

const grade = (value: string) => ({ description: GRADE_LABELS[value] ?? value, value });

/** "Anita Patel" → WebReg's "Patel,Anita". */
const instructors = (s: FakeSection) =>
    s.instructors.map((name, i) => {
        const parts = name.split(' ');
        const last = parts.pop() ?? name;
        return { descr: `${last},${parts.join(' ')}`, print: true, bio: '', value: `70000000${i}`, email: `${last.toUpperCase()}@UDEL.EDU` };
    });

export const envelope = (object: unknown) => Response.json({ result: 'SUCCESS', messages: [], errors: [], object });

export const failure = (errors: string[], status = 200) => Response.json({ result: 'FAILURE', messages: [], errors, object: null }, { status });

const DAY_TIME = (s: FakeSection): string => {
    const m = s.meetings[0];
    if (!m) return '';
    const clock = ([h, min]: number[]) => `${h! % 12 === 0 ? 12 : h! % 12}:${String(min).padStart(2, '0')} ${h! < 12 ? 'AM' : 'PM'}`;
    return ` ${m.days.join('')} ${clock(m.startTime)} - ${clock(m.endTime)}`;
};

const seatWords = (s: FakeSection): string => (!isFull(s) ? 'Open Seats' : s.waitlistPossible ? 'Waitlist Available' : 'Closed');

/** assoc.LAB's {descr, value}: the time and seat status ride in the description. */
const assocItem = (course: FakeCourse, s: FakeSection) => ({ descr: `${s.id} ${course.title.toUpperCase()}${DAY_TIME(s)} (${seatWords(s)})`, value: s.id });

/** The section object every WebReg answer uses. */
function section(strm: string, course: FakeCourse, s: FakeSection): Record<string, unknown> {
    const lab = s.component === 'LAB';
    const labs = s.labs.map((id) => findSection(strm, id)?.section).filter((l): l is FakeSection => l !== undefined);
    const options = lab ? ['NON'] : course.gradeOptions;
    return {
        courseId: s.id,
        classSection: s.id.replace(/^[A-Z]+\d{3}/, ''),
        type: s.component,
        descr: course.title.toUpperCase(),
        longDescr: course.description,
        creditOpt: lab ? [0] : course.creditOpt.map(Number),
        gradeOptions: options.map(grade),
        calendar: s.meetings,
        instructors: instructors(s),
        components: labs.length ? [{ optional: false, type: 'LAB' }] : [],
        assoc: labs.length ? { LAB: labs.map((l) => assocItem(course, l)) } : {},
        labs: labs.map((l) => assocItem(course, l)),
        notes: s.notes,
        online: s.meetings.length === 0,
        waitlistPossible: s.waitlistPossible,
        canceled: false,
    };
}

export function scheduleEntry(strm: string, e: Enrollment): Record<string, unknown> {
    const found = findSection(strm, e.id);
    const base = found ? section(strm, found.course, found.section) : { courseId: e.id, descr: '', calendar: [], instructors: [] };
    return { ...base, creditHr: e.credits, gradeOption: grade(e.gradeOption), waitlisted: e.status === 'Waitlisted', dropped: false, withdrawn: false, withdrawable: false, droppable: true, editable: true, swappable: true };
}

export function sectionInfo(strm: string, course: FakeCourse, s: FakeSection): Record<string, unknown> {
    return { ...section(strm, course, s), full: isFull(s), waitlistTotal: s.waitlistTotal, status: 'SATISFIED', errors: [] };
}

export const sectionLabel = (s: FakeSection): string => `${s.id} (${seatWords(s)})`;
