// The degree audit, reduced to what a dashboard can show at a glance: for each program the student
// is held to (the major, the university requirements, breadth, the credit minimum), whether Stellic
// counts it satisfied, its credits taken / in progress / still needed, and the requirements it still
// lists as open — Stellic's `cards_remaining`, named from the requirement tree.
//
// Nothing is judged here: satisfied, the credit figures and the open list are Stellic's own.

import type { RawAudit, RawReq } from '@/services/stellic/stellic-types';
import type { DegreeAudit, OpenRequirement, ProgramProgress } from '@/services/types/stellic';

const isReq = (value: unknown): value is RawReq => typeof value === 'object' && value !== null && 'id' in value;

/** Every requirement's name by id, from the whole tree. */
export function requirementNames(programs: RawReq[]): Map<number, string> {
    const names = new Map<number, string>();
    const visit = (node: RawReq) => {
        if (typeof node.id === 'number' && node.screen_name && !names.has(node.id)) names.set(node.id, node.screen_name);
        for (const child of node.choices ?? []) if (isReq(child)) visit(child);
    };
    programs.forEach(visit);
    return names;
}

/** Program titles carry catalog noise ("… Minimum Total Credits 2019F", "(17F-current)"). */
export const tidyProgramName = (name: string): string =>
    name
        .replace(/\s*\(\d{2}[FSW]-current\)\s*$/i, '')
        .replace(/\s+\d{4}[FSW]\s*$/i, '')
        .trim();

export function mapAudit(raw: RawAudit): DegreeAudit {
    const programs = raw.req_tree?.programs ?? [];
    const names = requirementNames(programs);
    const data = raw.audit_data ?? {};
    const progress: ProgramProgress[] = programs
        .filter((p) => typeof p.id === 'number')
        .map((p) => {
            const node = data[String(p.id)] ?? {};
            const units = node.progress_data?.units_summary ?? {};
            const open = new Map<string, OpenRequirement>();
            for (const card of node.cards_remaining ?? []) {
                const name = names.get(card.requirement_id ?? -1) ?? 'Requirement';
                const entry = open.get(name) ?? { name, count: 0, credits: 0 };
                entry.count += 1;
                entry.credits += card.units ?? 0;
                open.set(name, entry);
            }
            return {
                id: String(p.id),
                name: tidyProgramName(p.screen_name ?? 'Program'),
                satisfied: node.satisfied === true,
                credits: { taken: units.taken ?? 0, inProgress: units.in_progress ?? 0, remaining: units.remaining ?? 0 },
                open: [...open.values()],
            };
        });
    return {
        gpa: raw.student_audit?.grades_summary?.c_gpa ?? null,
        pathway: raw.remaining_reqs_details?.pathway?.name ?? null,
        programs: progress,
        computedAt: raw.last_computed ?? null,
    };
}

/** The program the credit bar is drawn from: the credit minimum when there is one, else the largest. */
export const creditProgram = (audit: DegreeAudit): ProgramProgress | null =>
    audit.programs.find((p) => /total credits/i.test(p.name)) ?? [...audit.programs].sort((a, b) => b.credits.taken + b.credits.inProgress + b.credits.remaining - (a.credits.taken + a.credits.inProgress + a.credits.remaining))[0] ?? null;
