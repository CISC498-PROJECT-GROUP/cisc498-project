// One planned add (a lecture and its lab) in the plan list: when it meets, what it swaps out, its
// credits and grading (from the options WebReg offers for it), the waitlist choice when it is full,
// and any clash with the rest of the schedule.

import { Icon } from '@/components/common/icon';
import { sectionCode } from '@/services/webreg/section-id';
import { formatMeetings } from '@/services/webreg/times';
import type { PlanActions } from '@/services/hooks/use-webreg-plan';
import type { PlannedAdd } from '@/services/types/webreg';

interface PlanItemProps {
    add: PlannedAdd;
    plan: PlanActions;
    clashes: string[];
}

export function PlanItem({ add, plan, clashes }: PlanItemProps) {
    const [main, ...rest] = add.sections;
    const select = (e: Event) => (e.target as HTMLSelectElement).value;
    return (
        <li class="ca-plan-item">
            <div class="ca-plan-item-head">
                <span class="ca-plan-kind">{add.replaces.length ? 'Swap' : add.waitlist ? 'Waitlist' : 'Add'}</span>
                <span class="ca-search-code">{[main, ...rest].map((s) => s.code).join(' + ')}</span>
                <button type="button" class="ca-icon-btn" aria-label={`Remove ${main.code} from the plan`} onClick={() => plan.remove(add.key)}>
                    <Icon name="close" size={14} />
                </button>
            </div>
            <p class="ca-plan-title">{main.title}</p>
            {[main, ...rest].map((s) => (
                <p key={s.id} class="ca-muted ca-small">
                    {rest.length > 0 && `${s.component}: `}
                    {formatMeetings(s.meetings)}
                </p>
            ))}
            {add.replaces.length > 0 && <p class="ca-small">Replaces {add.replaces.map(sectionCode).join(' + ')} — kept if the new section can't be added.</p>}
            <div class="ca-plan-opts">
                <label class="ca-plan-opt">
                    <span>Credits</span>
                    {main.creditOptions.length > 1 ? (
                        <select class="ca-mini-select" value={String(main.credits)} onChange={(e) => plan.update(add.key, main.id, { credits: Number(select(e)) })}>
                            {main.creditOptions.map((c) => (
                                <option key={c} value={String(c)}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <strong>{main.credits}</strong>
                    )}
                </label>
                {main.gradeOptions.length > 0 && (
                    <label class="ca-plan-opt">
                        <span>Grading</span>
                        <select class="ca-mini-select" value={main.gradeOption} onChange={(e) => plan.update(add.key, main.id, { gradeOption: select(e) })}>
                            {main.gradeOptions.map((g) => (
                                <option key={g.value} value={g.value}>
                                    {g.label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                {main.full && main.waitlistPossible && !add.replaces.length && (
                    <label class="ca-plan-opt ca-plan-opt--check">
                        <input type="checkbox" checked={add.waitlist} onChange={(e) => plan.setWaitlist(add.key, (e.target as HTMLInputElement).checked)} />
                        <span>Join the waitlist (it's full)</span>
                    </label>
                )}
            </div>
            {clashes.length > 0 && (
                <p class="ca-clash">
                    <Icon name="alert" size={12} />
                    Conflicts with {clashes.map(sectionCode).join(', ')}
                </p>
            )}
        </li>
    );
}
