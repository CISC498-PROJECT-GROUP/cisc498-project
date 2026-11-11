// The one place the site changes a student's registration. It lists every write exactly — each
// section, its credits and grading, and for a drop the corequisites WebReg says leave with it — and
// sends nothing until the student ticks "I understand this changes my real registration in WebReg"
// and presses the button. Then the writes run in order, each showing WebReg's own answer.

import { useState } from 'preact/hooks';
import { LoadState } from '@/components/common/load-state';
import { Modal } from '@/components/schedule/modal';
import { StepView } from '@/components/schedule/step-outcome';
import { useCorequisites } from '@/services/hooks/use-webreg';
import { useRegistration } from '@/services/hooks/use-webreg-register';
import { withCorequisites } from '@/services/webreg/plan';
import type { RegisteredSection, WriteStep } from '@/services/types/webreg';

interface ReviewDialogProps {
    strm: string;
    termLabel: string;
    steps: WriteStep[];
    registered: RegisteredSection[];
    onClose: () => void;
    onFinished: () => void;
}

export function ReviewDialog({ strm, termLabel, steps, registered, onClose, onFinished }: ReviewDialogProps) {
    const dropIds = steps.flatMap((s) => (s.kind === 'drop' ? s.sections.map((x) => x.id) : []));
    const coreqs = useCorequisites(dropIds);
    const registration = useRegistration(onFinished);
    const [understood, setUnderstood] = useState(false);
    const ready = coreqs.data !== null && !coreqs.loading;
    const full = ready ? steps.map((s) => withCorequisites(s, coreqs.data ?? {}, registered)) : steps;
    const started = registration.outcomes.length > 0;
    const failed = registration.outcomes.some((o) => o.status === 'failed');

    return (
        <Modal title={started ? 'Registration results' : 'Review your changes'} onClose={onClose} locked={registration.running}>
            {!started && (
                <p class="ca-modal-lead">
                    These changes go to WebReg for the <strong>{termLabel}</strong>, in this order. If WebReg refuses one, the ones after it are not sent.
                </p>
            )}
            {dropIds.length > 0 && !ready && <LoadState state={coreqs} rows={1} />}
            <ol class="ca-steps">
                {(started ? registration.outcomes.map((o) => o.step) : full).map((step, i) => (
                    <StepView key={i} step={step} index={i} outcome={registration.outcomes[i] ?? null} />
                ))}
            </ol>
            {!started ? (
                <div class="ca-sched-confirm">
                    <label class="ca-sched-confirm-check">
                        <input type="checkbox" checked={understood} onChange={(e) => setUnderstood((e.target as HTMLInputElement).checked)} />
                        <span>I understand this changes my real registration in WebReg.</span>
                    </label>
                    <div class="ca-modal-actions">
                        <button type="button" class="ca-btn ca-btn--quiet" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="button" class="ca-btn ca-btn--primary" disabled={!understood || !ready} onClick={() => registration.run(strm, full)}>
                            Register {full.length === 1 ? 'this change' : `these ${full.length} changes`}
                        </button>
                    </div>
                </div>
            ) : (
                <div class="ca-sched-confirm">
                    <p class="ca-muted ca-small" role="status">
                        {registration.running ? 'Sending to WebReg — keep this page open.' : failed ? 'Not everything went through. Your schedule below is what WebReg has now.' : 'WebReg accepted every change. Your schedule below is updated.'}
                    </p>
                    <div class="ca-modal-actions">
                        <button type="button" class="ca-btn ca-btn--primary" disabled={registration.running} onClick={onClose}>
                            Done
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
