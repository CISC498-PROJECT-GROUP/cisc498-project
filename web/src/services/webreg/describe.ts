// A write as the student reads it in the confirm dialog and its results: what it does, to which
// sections, with what credits and grading. Pure — every word comes from the step itself.

import { gradeLabel } from '@/services/webreg/map-common';
import type { StepSection, WriteStep } from '@/services/types/webreg';

export interface StepText {
    verb: string;
    lines: string[];
}

const credits = (n: number) => `${n} ${n === 1 ? 'credit' : 'credits'}`;

/** "CISC 108-010 · 3 credits · Standard grading", or just the code for a lab with no credits. */
export const sectionLine = (s: StepSection): string => (s.credits > 0 || s.gradeOption !== 'NON' ? `${s.code} · ${credits(s.credits)} · ${gradeLabel(s.gradeOption)}` : `${s.code} (no separate credit or grade)`);

export function describeStep(step: WriteStep): StepText {
    const line = sectionLine;
    switch (step.kind) {
        case 'add':
            return { verb: step.waitlist ? 'Join the waitlist for' : 'Add', lines: step.sections.map(line) };
        case 'drop':
            return { verb: step.withdraw ? 'Withdraw from' : 'Drop', lines: step.sections.map((s) => s.code) };
        case 'swap':
            return { verb: 'Swap', lines: [...step.out.map((s) => `Out: ${s.code}`), ...step.in.map((s) => `In: ${line(s)}`)] };
        case 'edit':
            return { verb: 'Change', lines: [line(step.section)] };
    }
}

/** A short title: "Add CISC 108-010", "Swap CISC 220-010 → CISC 220-011". */
export function stepTitle(step: WriteStep): string {
    if (step.kind === 'swap') return `Swap ${step.out[0]?.code ?? ''} → ${step.in[0]?.code ?? ''}`;
    if (step.kind === 'edit') return `Change ${step.section.code}`;
    return `${describeStep(step).verb} ${step.sections[0]?.code ?? ''}${step.sections.length > 1 ? ` + ${step.sections.length - 1} more` : ''}`;
}
