// The strip under the heading: the term picker (the terms WebReg lets the student open), where that
// term's registration stands, and the credit load — WebReg's registered total, what the plan would
// make it, and the limit.

import { registrationWindow } from '@/services/webreg/window';
import type { CreditLoad } from '@/services/webreg/plan';
import type { WebregSchedule } from '@/services/types/webreg';

interface TermPickerProps {
    schedule: WebregSchedule;
    loading: boolean;
    onPick: (strm: string) => void;
}

export function TermPicker({ schedule, loading, onPick }: TermPickerProps) {
    const terms = schedule.terms.length ? schedule.terms : [{ strm: schedule.term.strm, label: schedule.term.label }];
    return (
        <label class="ca-sched-term">
            <span class="ca-sr-only">Term</span>
            <select class="ca-field ca-sched-select" value={schedule.term.strm} disabled={loading} onChange={(e) => onPick((e.target as HTMLSelectElement).value)}>
                {terms.map((t) => (
                    <option key={t.strm} value={t.strm}>
                        {t.label || t.strm}
                    </option>
                ))}
            </select>
        </label>
    );
}

function CreditMeter({ load }: { load: CreditLoad }) {
    const max = load.max ?? Math.max(load.after, load.current, 1);
    const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
    const changed = load.after !== load.current || load.waitlisted > 0;
    return (
        <div class="ca-sched-credits">
            <div class="ca-sched-credits-text">
                <span class="ca-sched-credits-num">{load.current}</span>
                <span>
                    credits registered
                    {changed && (
                        <>
                            {' · '}
                            <strong class={load.over ? 'ca-sched-over' : undefined}>{load.after} with your plan</strong>
                        </>
                    )}
                    {load.waitlisted > 0 && ` · ${load.waitlisted} waitlisted`}
                    {load.max !== null && ` · limit ${load.max}`}
                </span>
            </div>
            <div class={`ca-sched-meter${load.over ? ' ca-sched-meter--over' : ''}`} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={load.after} aria-label={`Credits: ${load.after} of ${max}`}>
                <span class="ca-sched-meter-plan" style={{ width: pct(load.after) }} />
                <span class="ca-sched-meter-now" style={{ width: pct(Math.min(load.current, load.after)) }} />
            </div>
            {load.over && <p class="ca-sched-warn">Your plan is over the {load.max}-credit limit — WebReg will refuse the add that crosses it.</p>}
        </div>
    );
}

interface TermBarProps {
    schedule: WebregSchedule;
    load: CreditLoad;
}

export function TermBar({ schedule, load }: TermBarProps) {
    const window = registrationWindow(schedule.term, new Date());
    const locked = schedule.readOnly ? 'WebReg shows this term read-only.' : !schedule.isAddPossible ? 'WebReg is not taking adds for this term.' : schedule.swapOnly ? 'Only swaps are allowed in this term right now.' : null;
    return (
        <div class="ca-sched-bar">
            <div class="ca-sched-window">
                <span class={`ca-sched-status ca-sched-status--${window.tone}`}>{window.label}</span>
                {window.detail && <span class="ca-muted">{window.detail}</span>}
                {locked && <span class="ca-sched-locked">{locked}</span>}
            </div>
            <CreditMeter load={load} />
        </div>
    );
}
