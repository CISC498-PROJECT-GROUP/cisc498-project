// One write in the review dialog: before it runs, exactly what it will do; once run, WebReg's own
// answer — per-section results, its messages (warnings included) and its errors.

import { Icon } from '@/components/common/icon';
import { describeStep } from '@/services/webreg/describe';
import type { StepOutcome, WriteStep } from '@/services/types/webreg';

const STATUS_TEXT: Record<StepOutcome['status'], string> = { waiting: 'Waiting', running: 'Sending to WebReg…', done: 'Done', failed: 'Not done', skipped: 'Not sent' };

interface StepViewProps {
    step: WriteStep;
    index: number;
    outcome: StepOutcome | null;
}

export function StepView({ step, index, outcome }: StepViewProps) {
    const text = describeStep(step);
    const status = outcome?.status ?? null;
    const result = outcome?.result ?? null;
    return (
        <li class={`ca-step${status ? ` ca-step--${status}` : ''}`}>
            <div class="ca-step-head">
                <span class="ca-step-num" aria-hidden="true">
                    {status === 'done' ? <Icon name="check" size={13} /> : status === 'failed' ? <Icon name="alert" size={13} /> : index + 1}
                </span>
                <span class="ca-step-verb">{text.verb}</span>
                {status && (
                    <span class="ca-step-status" role="status">
                        {STATUS_TEXT[status]}
                    </span>
                )}
            </div>
            <ul class="ca-step-lines">
                {text.lines.map((line) => (
                    <li key={line}>{line}</li>
                ))}
            </ul>
            {result && result.sections.length > 0 && (
                <ul class="ca-step-results" aria-label="WebReg's result for each section">
                    {result.sections.map((s) => (
                        <li key={s.id} class={s.ok ? 'ca-step-ok' : 'ca-step-no'}>
                            {s.code}: {s.ok ? 'done' : 'not done'}
                        </li>
                    ))}
                </ul>
            )}
            {result?.messages.map((m) => (
                <p key={m} class="ca-step-msg">
                    {m}
                </p>
            ))}
            {result?.errors.map((e) => (
                <p key={e} class="ca-step-err">
                    {e}
                </p>
            ))}
            {outcome?.error && <p class="ca-step-err">{outcome.error}</p>}
            {status === 'failed' && !result?.errors.length && !outcome?.error && <p class="ca-step-err">WebReg didn't confirm this change. Check your schedule before trying again.</p>}
        </li>
    );
}
