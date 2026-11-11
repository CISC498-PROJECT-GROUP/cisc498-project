// The planned schedule, worked out against what WebReg says is registered: which planned adds are
// still to do, the credit load before and after, and the writes that would carry the plan out, in
// order — swaps first (a seat held is not lost if the add fails), then drops, then adds. A lecture
// and its required lab go in one write. Pure; WebReg decides what actually happens.

import { courseKey } from '@/services/webreg/section-id';
import type { PlanDraft, PlannedAdd, PlannedSection, RegisteredSection, SectionInfo, StepSection, WebregSchedule, WriteStep } from '@/services/types/webreg';

export const roundCredits = (n: number): number => Math.round(n * 100) / 100;

export const sumCredits = (items: { credits: number }[]): number => roundCredits(items.reduce((n, s) => n + (Number.isFinite(s.credits) ? s.credits : 0), 0));

export const stepSection = (s: PlannedSection | RegisteredSection): StepSection => ({ id: s.id, code: s.code, credits: s.credits, gradeOption: s.gradeOption });

/** Adds not yet done: an add whose lecture WebReg already lists as registered is finished. */
export function pendingAdds(draft: PlanDraft, registered: RegisteredSection[]): PlannedAdd[] {
    const ids = new Set(registered.map((s) => s.id));
    return draft.adds.filter((add) => !ids.has(add.sections[0]?.id ?? ''));
}

/** Registered sections a plan would give up: drops, and what swaps replace. */
export function leavingIds(draft: PlanDraft, registered: RegisteredSection[]): Set<string> {
    const ids = new Set(registered.map((s) => s.id));
    const out = new Set(draft.drops.filter((id) => ids.has(id)));
    for (const add of pendingAdds(draft, registered)) for (const id of add.replaces) if (ids.has(id)) out.add(id);
    return out;
}

/** Registered sections of the same course as `section` — what adding it would swap out. */
export const replacementsFor = (section: Pick<SectionInfo, 'course' | 'id'>, registered: RegisteredSection[]): string[] => registered.filter((s) => courseKey(s.course) === courseKey(section.course) && s.id !== section.id).map((s) => s.id);

export interface CreditLoad {
    /** WebReg's own total for the registered schedule. */
    current: number;
    /** After the plan, if WebReg accepts all of it. */
    after: number;
    /** Planned onto a waitlist — not counted in `after`. */
    waitlisted: number;
    max: number | null;
    over: boolean;
}

export function creditLoad(schedule: WebregSchedule, draft: PlanDraft): CreditLoad {
    const leaving = leavingIds(draft, schedule.sections);
    const dropped = sumCredits(schedule.sections.filter((s) => leaving.has(s.id) && !s.waitlisted));
    const adds = pendingAdds(draft, schedule.sections);
    const added = sumCredits(adds.filter((a) => !a.waitlist).flatMap((a) => a.sections));
    const waitlisted = sumCredits(adds.filter((a) => a.waitlist).flatMap((a) => a.sections));
    const after = roundCredits(schedule.totalCredits - dropped + added);
    return { current: schedule.totalCredits, after, waitlisted, max: schedule.maxCredits, over: schedule.maxCredits !== null && after > schedule.maxCredits };
}

/** The writes that carry out the plan, in the order they are made. */
export function planSteps(draft: PlanDraft, schedule: WebregSchedule): WriteStep[] {
    const registered = new Map(schedule.sections.map((s) => [s.id, s]));
    const withdraw = (s: RegisteredSection) => schedule.term.isWithdrawPeriod && s.withdrawable;
    const adds = pendingAdds(draft, schedule.sections);
    const swaps: WriteStep[] = [];
    const plain: WriteStep[] = [];
    const swapped = new Set<string>();
    for (const add of adds) {
        const out = add.replaces.map((id) => registered.get(id)).filter((s): s is RegisteredSection => s !== undefined);
        const sections = add.sections.map(stepSection);
        if (out.length) {
            out.forEach((s) => swapped.add(s.id));
            swaps.push({ kind: 'swap', out: out.map(stepSection), in: sections, component: add.sections[0]?.component ?? '' });
        } else plain.push({ kind: 'add', sections, waitlist: add.waitlist });
    }
    const drops: WriteStep[] = draft.drops
        .map((id) => registered.get(id))
        .filter((s): s is RegisteredSection => s !== undefined && !swapped.has(s.id))
        .map((s) => ({ kind: 'drop', sections: [stepSection(s)], withdraw: withdraw(s) }));
    return [...swaps, ...drops, ...plain];
}

/** A drop with the corequisites WebReg says go with it (from /registration/check), listed so the
    student sees every section that leaves. */
export function withCorequisites(step: WriteStep, coreqs: Record<string, string[]>, registered: RegisteredSection[]): WriteStep {
    if (step.kind !== 'drop') return step;
    const byId = new Map(registered.map((s) => [s.id, s]));
    const ids = new Set(step.sections.map((s) => s.id));
    const extra = step.sections.flatMap((s) => coreqs[s.id] ?? []).filter((id) => !ids.has(id) && ids.add(id));
    const sections = [
        ...step.sections,
        ...extra
            .map((id) => byId.get(id))
            .filter((s): s is RegisteredSection => s !== undefined)
            .map(stepSection),
    ];
    return { ...step, sections };
}

/** Every section id a step touches. */
export const stepIds = (step: WriteStep): string[] => (step.kind === 'swap' ? [...step.out, ...step.in] : step.kind === 'edit' ? [step.section] : step.sections).map((s) => s.id);
