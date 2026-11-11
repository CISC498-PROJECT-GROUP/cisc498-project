// Changes to a planned schedule — the draft a student builds before registering. Pure: each takes a
// draft and returns a new one. The draft is kept per term in the student's browser
// (hooks/use-webreg-plan.ts) and is never the record; WebReg is.

import type { ComponentSection, PlanDraft, PlannedAdd, PlannedSection, SectionInfo } from '@/services/types/webreg';

export const EMPTY_DRAFT: PlanDraft = { adds: [], drops: [] };

/** A section's planned form: the lowest credit option and the first grade option, until changed; NON
    when WebReg offers no grading of its own. */
export function plannedSection(info: SectionInfo): PlannedSection {
    const credits = info.creditOptions[0] ?? 0;
    const gradeOption = info.gradeOptions[0]?.value ?? 'NON';
    return {
        id: info.id,
        code: info.code,
        course: info.course,
        title: info.title,
        component: info.component,
        credits,
        creditOptions: info.creditOptions,
        gradeOption,
        gradeOptions: info.gradeOptions,
        meetings: info.meetings,
        instructors: info.instructors,
        full: info.full,
        waitlistPossible: info.waitlistPossible,
    };
}

/** Add (or replace) the planned add for a lecture. A course appears once in a plan: planning a second
    section of it replaces the first. */
export function addToDraft(draft: PlanDraft, add: PlannedAdd): PlanDraft {
    const course = add.sections[0]?.course;
    const adds = draft.adds.filter((a) => a.key !== add.key && a.sections[0]?.course !== course);
    return { ...draft, adds: [...adds, add], drops: draft.drops.filter((id) => !add.replaces.includes(id)) };
}

export const removeAdd = (draft: PlanDraft, key: string): PlanDraft => ({ ...draft, adds: draft.adds.filter((a) => a.key !== key) });

export function toggleDrop(draft: PlanDraft, id: string): PlanDraft {
    const drops = draft.drops.includes(id) ? draft.drops.filter((d) => d !== id) : [...draft.drops, id];
    return { ...draft, drops };
}

/** Change a planned section's credits or grading. */
export function updateSection(draft: PlanDraft, key: string, id: string, change: Partial<Pick<PlannedSection, 'credits' | 'gradeOption'>>): PlanDraft {
    const adds = draft.adds.map((a) => (a.key !== key ? a : { ...a, sections: a.sections.map((s) => (s.id === id ? { ...s, ...change } : s)) }));
    return { ...draft, adds };
}

export const setWaitlist = (draft: PlanDraft, key: string, waitlist: boolean): PlanDraft => ({ ...draft, adds: draft.adds.map((a) => (a.key === key ? { ...a, waitlist } : a)) });

/** After registering: forget adds now registered and drops no longer registered. */
export function pruneDraft(draft: PlanDraft, registeredIds: string[]): PlanDraft {
    const ids = new Set(registeredIds);
    return { adds: draft.adds.filter((a) => !ids.has(a.sections[0]?.id ?? '')), drops: draft.drops.filter((id) => ids.has(id)) };
}

/** A stored draft, checked field by field — storage is the student's to clear or corrupt. */
export function readDraft(value: unknown): PlanDraft {
    if (!value || typeof value !== 'object') return EMPTY_DRAFT;
    const v = value as Partial<PlanDraft>;
    const adds = Array.isArray(v.adds) ? v.adds.filter((a): a is PlannedAdd => !!a && typeof a.key === 'string' && Array.isArray(a.sections) && a.sections.length > 0 && Array.isArray(a.replaces)) : [];
    const drops = Array.isArray(v.drops) ? v.drops.filter((d): d is string => typeof d === 'string') : [];
    return { adds, drops };
}

/** A lab (or other required component) as planned: no credits or grade of its own. */
export const plannedComponent = (c: ComponentSection, lecture: SectionInfo, type: string): PlannedSection => ({
    id: c.id,
    code: c.code,
    course: lecture.course,
    title: lecture.title,
    component: type,
    credits: 0,
    creditOptions: [0],
    gradeOption: 'NON',
    gradeOptions: [],
    meetings: c.meetings,
    instructors: c.instructors,
    full: c.full,
    waitlistPossible: false,
});

/** The planned add for a lecture and the components chosen for it. `replaces` — the registered
    sections of the same course — makes it a swap. Full with a waitlist: planned onto the waitlist. */
export function plannedAddFor(info: SectionInfo, components: { type: string; section: ComponentSection }[], replaces: string[]): PlannedAdd {
    const sections = [plannedSection(info), ...components.map((c) => plannedComponent(c.section, info, c.type))];
    return { key: info.id, sections, replaces, waitlist: info.full && info.waitlistPossible };
}
