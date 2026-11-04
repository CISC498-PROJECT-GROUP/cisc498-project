// The degree audit at a glance: each program the student is held to, where it stands, its credits,
// and what it still lists as open. The credit-minimum program is left out here because the hero's
// credit bar already is that program. A program Stellic calls satisfied only thanks to planned
// courses says "On track with plan", not "Complete" — see programStatus in services/stellic/audit.ts.

import { Icon } from '@/components/common/icon';
import { Card } from '@/components/dashboard/card';
import { CreditBar } from '@/components/dashboard/credit-bar';
import { creditProgram } from '@/services/stellic/audit';
import type { Loadable } from '@/services/types';
import type { DegreeAudit, ProgramProgress, ProgramStatus } from '@/services/types/stellic';

interface DegreeProgressProps {
    audit: Loadable<DegreeAudit | null>;
}

const PILL: Record<ProgramStatus, string> = { complete: 'ca-pill--done', 'in-progress': 'ca-pill--now', planned: 'ca-pill--plain', open: 'ca-pill--open' };

const pillText = (program: ProgramProgress): string => {
    const open = program.open.reduce((n, r) => n + r.count, 0);
    if (program.status === 'complete') return 'Complete';
    if (program.status === 'in-progress') return 'In progress';
    if (program.status === 'planned') return 'On track with plan';
    return open > 0 ? `${open} open` : 'Not yet satisfied';
};

function Program({ program }: { program: ProgramProgress }) {
    return (
        <li class="ca-program">
            <div class="ca-program-head">
                <span class="ca-program-name">{program.name}</span>
                <span class={`ca-pill ${PILL[program.status]}`}>
                    {program.status === 'complete' && <Icon name="check" size={12} />}
                    {pillText(program)}
                </span>
            </div>
            {program.status !== 'complete' && <CreditBar credits={program.credits} compact />}
            {program.open.length > 0 && (
                <ul class="ca-open-list">
                    {program.open.map((r) => (
                        <li key={r.name} class="ca-open-item">
                            <span>{r.name}</span>
                            <span class="ca-faint">
                                {r.count > 1 ? `${r.count} × ` : ''}
                                {r.count > 1 ? r.credits / r.count : r.credits} cr
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}

export function DegreeProgress({ audit }: DegreeProgressProps) {
    const data = audit.data;
    const bar = data ? creditProgram(data) : null;
    const programs = data?.programs.filter((p) => p !== bar) ?? [];
    const leansOnPlan = data?.programs.some((p) => p.status === 'planned') ?? false;
    return (
        <Card title="Degree progress" source="stellic" aside={data?.pathway ?? undefined} states={[audit]} rows={4}>
            <ul class="ca-program-list">
                {programs.map((p) => (
                    <Program key={p.id} program={p} />
                ))}
            </ul>
            {bar && bar.credits.remaining > 0 && <p class="ca-faint ca-small ca-program-foot">Plus {bar.credits.remaining} more credits toward the credit minimum.</p>}
            {leansOnPlan && <p class="ca-faint ca-small ca-program-foot">“On track with plan” means Stellic counts courses you have planned but not taken yet.</p>}
        </Card>
    );
}
