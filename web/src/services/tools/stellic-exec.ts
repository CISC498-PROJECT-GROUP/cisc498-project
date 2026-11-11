// get_degree_plan: the student's Stellic record as text for the model — profile, audit, plan, review.
// The four Stellic calls load side by side (each memoised for the page, as the Degree page uses
// them), and a part Stellic won't give is reported as missing rather than failing the whole tool.
// Every figure is Stellic's own; nothing is computed here but sums Stellic's mappers already make.

import { loadAudit, loadPlan, loadProfile, loadReview } from '@/services/stellic/load';
import type { DegreeAudit, PlanReview, StellicPlan, StellicProfile } from '@/services/types/stellic';
import { clip, type ToolOutput } from '@/services/tools/tool-helpers';

const settle = async <T>(load: () => Promise<T>): Promise<T | string> => load().catch((error: unknown) => (error instanceof Error ? error.message : String(error)));

function profileLines(profile: StellicProfile | string, review: PlanReview | string): string[] {
    if (typeof profile === 'string') return [`Profile: unavailable (${profile})`];
    const lines = [`Student: ${profile.name}`, `Standing: ${profile.standing ?? 'not given'} · School: ${profile.school ?? 'not given'} · Expected graduation: ${profile.graduation ?? 'not given'}`];
    if (profile.advisors.length > 0) lines.push(`Advisors: ${profile.advisors.map((a) => (a.email ? `${a.name} <${a.email}>` : a.name)).join('; ')}`);
    if (typeof review !== 'string') lines.push(review.reviewed ? 'Plan review: reviewed' : review.openWith ? `Plan review: open with ${review.openWith}${review.openSince ? ` since ${review.openSince}` : ''}` : 'Plan review: none open');
    return lines;
}

function auditLines(audit: DegreeAudit | string): string[] {
    if (typeof audit === 'string') return [`Degree audit: unavailable (${audit})`];
    const lines = [`Cumulative GPA: ${audit.gpa ?? 'not given'}${audit.computedAt ? ` (audit run ${audit.computedAt})` : ''}`];
    for (const p of audit.programs) {
        const c = p.credits;
        lines.push(`\n${p.name} — ${p.status} · credits: ${c.taken} earned, ${c.inProgress} in progress, ${c.planned} planned, ${c.remaining} to go`);
        for (const r of p.open) lines.push(`  - still open: ${r.name}${r.count > 1 ? ` ×${r.count}` : ''}${r.credits > 0 ? ` (${r.credits} cr)` : ''}`);
    }
    return lines;
}

function planLines(plan: StellicPlan | string): string[] {
    if (typeof plan === 'string') return [`Plan: unavailable (${plan})`];
    const lines = [`\nPrograms in the plan: ${plan.programs.join('; ') || 'none listed'}`];
    for (const term of plan.terms) {
        lines.push(`\n${term.label} (${term.when}):`);
        for (const c of term.courses) lines.push(`  - ${c.code} ${c.name} · ${c.credits} cr · ${c.status}${c.grade ? ` · grade ${c.grade}` : ''}`);
    }
    return lines;
}

export async function degreePlan(): Promise<ToolOutput> {
    const [profile, audit, plan, review] = await Promise.all([settle(loadProfile), settle(loadAudit), settle(loadPlan), settle(loadReview)]);
    if ([profile, audit, plan].every((part) => typeof part === 'string')) throw new Error(`Stellic didn't answer: ${String(plan)}`);
    return clip(['From Stellic, as Stellic states it:', ...profileLines(profile, review), ...auditLines(audit), ...planLines(plan)].join('\n'));
}
