import { describe, expect, test } from 'bun:test';
import { layoutWeek } from '@/services/webreg/calendar';
import { mapCreditOptions, mapGradeOptions, mapMeetings } from '@/services/webreg/map-common';
import { mapSchedule } from '@/services/webreg/map-schedule';
import { mapLookup, mapSectionInfo } from '@/services/webreg/map-section';
import { readVar, varLiteral } from '@/services/webreg/script-vars';
import { matchStellicTerm, seasonOf } from '@/services/webreg/term-match';
import { unwrap, WebregError } from '@/services/webreg/webreg-api';
import { registrationWindow } from '@/services/webreg/window';
import type { Term } from '@/services/types/stellic';

const SCRIPT = `var contextPath = "/registration";
var schedule = [{"courseId":"CISC220010","classSection":"010","type":"LEC","descr":"DATA STRUCTURES","creditHr":3,"gradeOption":{"description":"Standard Grading","value":"SG"},"waitlisted":false,"dropped":false,"withdrawn":false,"calendar":[{"days":["M","W","F"],"startTime":[10,10],"endTime":[11,0],"location":"Room ]; 1"}],"instructors":[{"descr":"Abernathy,Grace","email":"X@UDEL.EDU"},{"descr":"Staff"}]},{"courseId":"MATH241010","descr":"CALCULUS I","creditHr":4,"dropped":true,"calendar":[]}];
var term = {"strm":"2273","descr":"2027 Spring Semester","isAppointmentPeriod":true,"sessions":[{"openEnrollment":1800000000000,"endDropAdd":1810000000000}]};
var maxCredits = 17;
var totalCredits = 3;
var readOnly = false;
var swapOnly = 'no';`;

describe('script vars', () => {
    test('reads literals without running them, brackets inside strings included', () => {
        expect(varLiteral(SCRIPT, 'maxCredits')).toBe('17');
        const schedule = readVar([SCRIPT], 'schedule') as { calendar: { location: string }[] }[];
        expect(schedule[0].calendar[0].location).toBe('Room ]; 1');
        expect(readVar(['', SCRIPT], 'readOnly')).toBe(false);
        expect(readVar([SCRIPT], 'swapOnly')).toBe('no');
        expect(readVar([SCRIPT], 'isAddPossible')).toBeUndefined();
        expect(readVar(['var schedule = alert(1);'], 'schedule')).toBeUndefined();
    });

    test('maps the page vars into the registered schedule', () => {
        const raw = { schedule: readVar([SCRIPT], 'schedule'), term: readVar([SCRIPT], 'term'), maxCredits: 17, totalCredits: 3, readOnly: false, isAddPossible: undefined, swapOnly: false, terms: [{ strm: '2273', label: '2027 Spring Semester' }] };
        const s = mapSchedule(raw as never, '2273');
        expect(s.term).toMatchObject({ strm: '2273', label: '2027 Spring Semester', isAppointmentPeriod: true, isOpenEnrollment: false });
        expect(s.term.windows.openEnrollment?.getTime()).toBe(1800000000000);
        expect(s.sections).toHaveLength(1); // the dropped MATH 241 is history, not the schedule
        expect(s.sections[0]).toMatchObject({
            id: 'CISC220010',
            code: 'CISC 220-010',
            course: 'CISC 220',
            title: 'Data Structures',
            credits: 3,
            gradeOption: 'SG',
            gradeLabel: 'Standard Grading',
            status: 'Enrolled',
            waitlisted: false,
            instructors: ['Grace Abernathy'],
        });
        expect(s.sections[0].meetings[0]).toMatchObject({ days: ['M', 'W', 'F'], start: [10, 10], end: [11, 0] });
        expect(s).toMatchObject({ maxCredits: 17, totalCredits: 3, isAddPossible: true });
    });
});

describe('envelope', () => {
    test('anything but SUCCESS throws with WebReg’s own error', () => {
        expect(unwrap({ result: 'SUCCESS', object: 5 })).toBe(5);
        expect(() => unwrap({ result: 'FAILURE', errors: ['Time conflict.'] })).toThrow('Time conflict.');
        expect(() => unwrap({ result: 'FAILURE', errors: [{ message: 'Full.' }] })).toThrow(WebregError);
        expect(() => unwrap(null)).toThrow(WebregError);
    });
});

describe('lookups and section info', () => {
    test('a lookup is courses, or a whole course’s sections', () => {
        expect(mapLookup([{ label: 'CISC108: INTRO TO COMPUTER SCIENCE I', value: 'CISC108' }], 'CISC1')).toEqual({ kind: 'courses', courses: [{ id: 'CISC108', code: 'CISC 108', title: 'Intro to Computer Science I' }] });
        const found = mapLookup(
            [
                { label: 'CISC108010 (Open Seats)', value: 'CISC108010' },
                { label: 'CISC108020L (Closed)', value: 'CISC108020L' },
            ],
            'CISC108',
        );
        expect(found).toEqual({
            kind: 'sections',
            courseId: 'CISC108',
            sections: [
                { id: 'CISC108010', code: 'CISC 108-010', status: 'Open Seats', lab: false },
                { id: 'CISC108020L', code: 'CISC 108-020L', status: 'Closed', lab: true },
            ],
        });
    });

    test('credit and grade options in their several forms', () => {
        expect(mapCreditOptions([3])).toEqual([3]);
        expect(mapCreditOptions(['1', '2', '3'])).toEqual([1, 2, 3]);
        expect(mapCreditOptions('1-3')).toEqual([1, 2, 3]);
        expect(mapCreditOptions(undefined)).toEqual([]);
        expect(mapGradeOptions([{ description: 'Standard Grading', value: 'SG' }, { description: 'Pass/Fail Student Option', value: 'PFS' }, 'SG'])).toEqual([
            { value: 'SG', label: 'Standard Grading' },
            { value: 'PFS', label: 'Pass/Fail Student Option' },
        ]);
        expect(mapMeetings([{ days: [], startTime: [9, 0], endTime: [10, 0] }, { days: 'TR' }])).toEqual([]);
    });

    test('a lecture with its required lab and the labs that satisfy it', () => {
        const info = mapSectionInfo(
            {
                courseId: 'PHYS207010',
                type: 'LEC',
                descr: 'PHYSICS I',
                creditOpt: [4],
                full: false,
                components: [{ type: 'LAB', optional: false }],
                assoc: {
                    LAB: [
                        { descr: 'PHYS207020L PHYSICS I T 2:00 PM - 4:50 PM (Closed)', value: 'PHYS207020L' },
                        { descr: 'PHYS207021L PHYSICS I W F 9:05 AM - 9:55 AM (Open Seats)', value: 'PHYS207021L' },
                    ],
                },
                notes: ['Lab required.'],
                waitlistTotal: 2,
            },
            'PHYS207010',
        );
        expect(info).toMatchObject({ id: 'PHYS207010', code: 'PHYS 207-010', title: 'Physics I', creditOptions: [4], seats: { open: null, capacity: null }, notes: ['Lab required.'], waitlistTotal: 2, component: 'LEC' });
        expect(info.required).toEqual([
            {
                type: 'LAB',
                optional: false,
                candidates: [
                    { id: 'PHYS207020L', code: 'PHYS 207-020L', meetings: [{ days: ['T'], start: [14, 0], end: [16, 50], location: null, startDate: null, endDate: null }], instructors: [], full: true, seats: { open: null, capacity: null } },
                    { id: 'PHYS207021L', code: 'PHYS 207-021L', meetings: [{ days: ['W', 'F'], start: [9, 5], end: [9, 55], location: null, startDate: null, endDate: null }], instructors: [], full: false, seats: { open: null, capacity: null } },
                ],
            },
        ]);
    });
});

describe('the week grid', () => {
    const m = (days: string, start: [number, number], end: [number, number]) => ({ days: days.split('') as never, start, end, location: null, startDate: null, endDate: null });
    test('weekdays always, weekend only when used; 8am–10pm widened to fit', () => {
        expect(layoutWeek([]).days).toEqual(['M', 'T', 'W', 'R', 'F']);
        const late = layoutWeek([{ id: 'A', code: 'A', title: '', kind: 'registered', meetings: [m('S', [7, 0], [22, 30])] }]);
        expect(late).toMatchObject({ days: ['M', 'T', 'W', 'R', 'F', 'S'], startHour: 7, endHour: 23 });
    });

    test('overlapping blocks share the column and are flagged; a dropping section is not', () => {
        const layout = layoutWeek([
            { id: 'A', code: 'A', title: '', kind: 'registered', meetings: [m('M', [10, 10], [11, 0])] },
            { id: 'B', code: 'B', title: '', kind: 'planned', meetings: [m('M', [10, 30], [11, 30])] },
            { id: 'C', code: 'C', title: '', kind: 'dropping', meetings: [m('M', [10, 0], [10, 50])] },
        ]);
        const byId = Object.fromEntries(layout.blocks.map((b) => [b.item.id, b]));
        expect(byId.A.conflict && byId.B.conflict).toBe(true);
        expect(byId.C.conflict).toBe(false);
        expect(new Set(layout.blocks.map((b) => b.lane))).toEqual(new Set([0, 1, 2]));
        expect(layout.blocks.every((b) => b.lanes === 3)).toBe(true);
    });
});

describe('registration window and terms', () => {
    const term = {
        strm: '2273',
        label: '',
        isOpenEnrollment: false,
        isAppointmentPeriod: false,
        isPenaltyPeriod: false,
        isWithdrawPeriod: false,
        windows: { openEnrollment: new Date('2026-11-23T08:00:00'), addWithAppointment: new Date('2026-11-09T08:00:00'), endDropAdd: new Date('2027-02-19T17:00:00') },
    };
    const now = new Date('2026-11-01T12:00:00');
    test('states the window from WebReg’s flags and dates', () => {
        expect(registrationWindow({ ...term, isOpenEnrollment: true }, now)).toMatchObject({ label: 'Open enrollment', tone: 'open' });
        expect(registrationWindow({ ...term, isAppointmentPeriod: true }, now).detail).toContain('Open enrollment starts');
        expect(registrationWindow(term, now)).toMatchObject({ label: 'Registration not open yet', tone: 'soon' });
        expect(registrationWindow(term, new Date('2027-03-01')).tone).toBe('closed');
    });

    test('matches a WebReg term to the Stellic plan’s', () => {
        expect(seasonOf('2027 Spring Semester')).toEqual({ season: 'Spring', year: 2027 });
        expect(seasonOf('Winter 2027')).toEqual({ season: 'Winter', year: 2027 });
        const stellic = [{ label: 'Spring 2027', season: 'Spring', year: 2027 } as Term, { label: 'Fall 2026', season: 'Fall', year: 2026 } as Term];
        expect(matchStellicTerm('2027 Spring Semester', stellic)?.label).toBe('Spring 2027');
        expect(matchStellicTerm('2027 Summer Sessions', stellic)).toBeNull();
    });
});
