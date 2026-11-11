import { describe, expect, test } from 'bun:test';
import { addToDraft, EMPTY_DRAFT, pruneDraft, readDraft, toggleDrop, updateSection } from '@/services/webreg/plan-draft';
import { creditLoad, pendingAdds, planSteps, replacementsFor, sumCredits, withCorequisites } from '@/services/webreg/plan';
import type { PlannedAdd, PlannedSection, RegisteredSection, WebregSchedule } from '@/services/types/webreg';

const registered = (id: string, course: string, credits: number, extra: Partial<RegisteredSection> = {}): RegisteredSection => ({
    id,
    code: id,
    course,
    title: '',
    component: id.endsWith('L') ? 'LAB' : 'LEC',
    credits,
    gradeOption: credits ? 'SG' : 'NON',
    gradeLabel: '',
    meetings: [],
    instructors: [],
    status: 'Enrolled',
    waitlisted: false,
    waitlistPosition: null,
    withdrawable: true,
    ...extra,
});

const planned = (id: string, course: string, credits: number): PlannedSection => ({
    id,
    code: id,
    course,
    title: '',
    component: id.endsWith('L') ? 'LAB' : 'LEC',
    credits,
    creditOptions: [credits],
    gradeOption: credits ? 'SG' : 'NON',
    gradeOptions: [],
    meetings: [],
    instructors: [],
    full: false,
    waitlistPossible: false,
});

const add = (sections: PlannedSection[], replaces: string[] = [], waitlist = false): PlannedAdd => ({ key: sections[0].id, sections, replaces, waitlist });

const schedule = (sections: RegisteredSection[], extra: Partial<WebregSchedule> = {}): WebregSchedule => ({
    term: { strm: '2273', label: '2027 Spring Semester', isOpenEnrollment: true, isAppointmentPeriod: false, isPenaltyPeriod: false, isWithdrawPeriod: false, windows: { openEnrollment: null, addWithAppointment: null, endDropAdd: null } },
    terms: [],
    sections,
    maxCredits: 17,
    totalCredits: sumCredits(sections.filter((s) => !s.waitlisted)),
    readOnly: false,
    isAddPossible: true,
    swapOnly: false,
    ...extra,
});

const now = schedule([registered('CISC220010', 'CISC 220', 3), registered('PHYS207010', 'PHYS 207', 4), registered('PHYS207021L', 'PHYS 207', 0), registered('MATH210010', 'MATH 210', 3)]);

describe('credit totals', () => {
    test('sums credits and ignores bad values', () => {
        expect(sumCredits([{ credits: 3 }, { credits: 0.5 }, { credits: NaN }])).toBe(3.5);
    });

    test('a plan adds, drops and swaps against WebReg’s own total', () => {
        let draft = addToDraft(EMPTY_DRAFT, add([planned('CISC108010', 'CISC 108', 3), planned('CISC108020L', 'CISC 108', 0)]));
        draft = toggleDrop(draft, 'MATH210010');
        draft = addToDraft(draft, add([planned('MATH241010', 'MATH 241', 4)], [], true));
        const load = creditLoad(now, draft);
        expect(load).toEqual({ current: 10, after: 10, waitlisted: 4, max: 17, over: false });
        const heavy = addToDraft(draft, add([planned('CISC320010', 'CISC 320', 9)]));
        expect(creditLoad(now, heavy).over).toBe(true);
    });
});

describe('plan steps', () => {
    test('swaps first, then drops, then adds; lecture and lab together', () => {
        let draft = addToDraft(EMPTY_DRAFT, add([planned('CISC108010', 'CISC 108', 3), planned('CISC108020L', 'CISC 108', 0)]));
        draft = addToDraft(draft, add([planned('CISC220011', 'CISC 220', 3)], ['CISC220010']));
        draft = toggleDrop(draft, 'MATH210010');
        const steps = planSteps(draft, now);
        expect(steps.map((s) => s.kind)).toEqual(['swap', 'drop', 'add']);
        expect(steps[0]).toMatchObject({ kind: 'swap', out: [{ id: 'CISC220010' }], in: [{ id: 'CISC220011' }], component: 'LEC' });
        expect(steps[2]).toMatchObject({
            kind: 'add',
            sections: [
                { id: 'CISC108010', credits: 3, gradeOption: 'SG' },
                { id: 'CISC108020L', credits: 0, gradeOption: 'NON' },
            ],
        });
    });

    test('adds already registered are finished and drop out of the plan', () => {
        const draft = addToDraft(EMPTY_DRAFT, add([planned('CISC220010', 'CISC 220', 3)]));
        expect(pendingAdds(draft, now.sections)).toEqual([]);
        expect(planSteps(draft, now)).toEqual([]);
    });

    test('a drop in the withdraw period withdraws a withdrawable section', () => {
        const late = schedule(now.sections, { term: { ...now.term, isWithdrawPeriod: true } });
        expect(planSteps(toggleDrop(EMPTY_DRAFT, 'MATH210010'), late)[0]).toMatchObject({ kind: 'drop', withdraw: true });
    });

    test('a drop lists the corequisites WebReg says go with it', () => {
        const [step] = planSteps(toggleDrop(EMPTY_DRAFT, 'PHYS207010'), now);
        const full = withCorequisites(step, { PHYS207010: ['PHYS207021L'] }, now.sections);
        expect(full.kind === 'drop' && full.sections.map((s) => s.id)).toEqual(['PHYS207010', 'PHYS207021L']);
    });

    test('a second section of a registered course replaces it', () => {
        expect(replacementsFor({ id: 'PHYS207011', course: 'PHYS 207' }, now.sections)).toEqual(['PHYS207010', 'PHYS207021L']);
        expect(replacementsFor({ id: 'ENGL110010', course: 'ENGL 110' }, now.sections)).toEqual([]);
    });
});

describe('the draft', () => {
    test('one plan entry per course; planning it again replaces it, and lifts a planned drop', () => {
        let draft = toggleDrop(EMPTY_DRAFT, 'CISC220010');
        draft = addToDraft(draft, add([planned('CISC220011', 'CISC 220', 3)], ['CISC220010']));
        draft = addToDraft(draft, add([planned('CISC220012', 'CISC 220', 3)], ['CISC220010']));
        expect(draft.adds.map((a) => a.key)).toEqual(['CISC220012']);
        expect(draft.drops).toEqual([]);
    });

    test('changes grading, prunes what is done, and survives bad storage', () => {
        let draft = addToDraft(EMPTY_DRAFT, add([planned('MATH268010', 'MATH 268', 1)]));
        draft = updateSection(draft, 'MATH268010', 'MATH268010', { credits: 3, gradeOption: 'PFS' });
        expect(draft.adds[0].sections[0]).toMatchObject({ credits: 3, gradeOption: 'PFS' });
        draft = toggleDrop(draft, 'GONE101010');
        expect(pruneDraft(draft, ['MATH268010'])).toEqual({ adds: [], drops: [] });
        expect(readDraft('nonsense')).toEqual(EMPTY_DRAFT);
        expect(readDraft({ adds: [{ key: 1 }], drops: ['A', 2] })).toEqual({ adds: [], drops: ['A'] });
    });
});
