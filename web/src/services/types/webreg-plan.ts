/* The schedule builder's plan and writes: a planned section is a snapshot of WebReg's section info,
   kept as a draft in the student's browser until they register it; a write step is one change sent to
   WebReg, and its outcome is WebReg's own answer. Re-exported from types/webreg.ts. */

import type { GradeOption, Meeting, RegisteredSection } from '@/services/types/webreg';

/** One section in a planned change, snapshotted from WebReg's section info. */
export interface PlannedSection {
    id: string;
    code: string;
    course: string;
    title: string;
    component: string;
    credits: number;
    creditOptions: number[];
    gradeOption: string;
    gradeOptions: GradeOption[];
    meetings: Meeting[];
    instructors: string[];
    full: boolean;
    waitlistPossible: boolean;
}

/** A planned add: a lecture with its required components. `replaces` are registered sections of the
    same course it swaps out. */
export interface PlannedAdd {
    key: string;
    sections: PlannedSection[];
    replaces: string[];
    waitlist: boolean;
}

export interface PlanDraft {
    adds: PlannedAdd[];
    /** Registered section ids the student plans to drop. */
    drops: string[];
}

export interface StepSection {
    id: string;
    code: string;
    credits: number;
    gradeOption: string;
}

/** One write, in the order the site makes them. */
export type WriteStep =
    { kind: 'add'; sections: StepSection[]; waitlist: boolean } | { kind: 'drop'; sections: StepSection[]; withdraw: boolean } | { kind: 'swap'; out: StepSection[]; in: StepSection[]; component: string } | { kind: 'edit'; section: StepSection };

/** What WebReg said about one write — its own words, never assumed. */
export interface WriteResult {
    successful: boolean;
    sections: { id: string; code: string; ok: boolean }[];
    messages: string[];
    errors: string[];
    /** The registered schedule WebReg reports after the write, when it sends one. */
    schedule: RegisteredSection[] | null;
}

export type StepStatus = 'waiting' | 'running' | 'done' | 'failed' | 'skipped';

export interface StepOutcome {
    step: WriteStep;
    status: StepStatus;
    result: WriteResult | null;
    /** A failure to reach WebReg at all (network, session), as opposed to WebReg refusing. */
    error: string | null;
}
