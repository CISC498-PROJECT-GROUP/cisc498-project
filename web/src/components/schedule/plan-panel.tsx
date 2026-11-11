// The planned changes: adds and swaps, drops of registered sections, the credit total they come to,
// and the clashes among them — then "Review and register", which opens the confirm dialog. The plan
// is a draft kept in this browser; nothing changes in WebReg until the student confirms there.

import { PlanItem } from '@/components/schedule/plan-item';
import type { PlanActions } from '@/services/hooks/use-webreg-plan';
import type { CreditLoad } from '@/services/webreg/plan';
import type { PlannedAdd, RegisteredSection } from '@/services/types/webreg';

interface PlanPanelProps {
    adds: PlannedAdd[];
    drops: RegisteredSection[];
    plan: PlanActions;
    load: CreditLoad;
    conflicts: Map<string, string[]>;
    stepCount: number;
    canWrite: boolean;
    onReview: () => void;
}

export function PlanPanel({ adds, drops, plan, load, conflicts, stepCount, canWrite, onReview }: PlanPanelProps) {
    const clashesOf = (add: PlannedAdd) => [...new Set(add.sections.flatMap((s) => conflicts.get(s.id) ?? []))].filter((id) => !add.sections.some((s) => s.id === id));
    const clashing = adds.filter((a) => clashesOf(a).length > 0).length;
    const empty = !adds.length && !drops.length;

    return (
        <section class="ca-dash-card ca-plan" aria-labelledby="ca-plan-title">
            <div class="ca-dash-card-head">
                <h2 class="ca-dash-card-title" id="ca-plan-title">
                    Your plan
                </h2>
                {!empty && (
                    <button type="button" class="ca-link ca-dash-card-aside" onClick={plan.clear}>
                        Clear plan
                    </button>
                )}
            </div>
            {empty ? (
                <p class="ca-empty-line">Nothing planned yet. Add sections from search, or plan a drop from your registered classes.</p>
            ) : (
                <ul class="ca-plan-list">
                    {adds.map((add) => (
                        <PlanItem key={add.key} add={add} plan={plan} clashes={clashesOf(add)} />
                    ))}
                    {drops.map((s) => (
                        <li key={s.id} class="ca-plan-item ca-plan-item--drop">
                            <div class="ca-plan-item-head">
                                <span class="ca-plan-kind ca-plan-kind--drop">Drop</span>
                                <span class="ca-search-code">{s.code}</span>
                                <button type="button" class="ca-link" onClick={() => plan.toggleDrop(s.id)}>
                                    Keep it
                                </button>
                            </div>
                            <p class="ca-plan-title">{s.title}</p>
                            <p class="ca-muted ca-small">
                                {s.credits} credits · {s.status}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
            {!empty && (
                <div class="ca-plan-foot">
                    <p class="ca-plan-total">
                        <span>After these changes</span>
                        <strong class={load.over ? 'ca-sched-over' : undefined}>
                            {load.after}
                            {load.max !== null && ` / ${load.max}`} credits
                        </strong>
                    </p>
                    {clashing > 0 && <p class="ca-clash">{clashing === 1 ? 'One planned section has' : `${clashing} planned sections have`} a time conflict — WebReg will refuse it.</p>}
                    <button type="button" class="ca-btn ca-btn--primary ca-btn--block" disabled={!stepCount || !canWrite} onClick={onReview}>
                        Review and register{stepCount ? ` (${stepCount} ${stepCount === 1 ? 'change' : 'changes'})` : ''}
                    </button>
                    <p class="ca-muted ca-small">This plan is a draft saved in this browser. You'll see every change before anything is sent to WebReg.</p>
                </div>
            )}
        </section>
    );
}
