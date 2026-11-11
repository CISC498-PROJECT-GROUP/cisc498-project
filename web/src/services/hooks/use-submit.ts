// Sending a submission. Owns the sending/done/error state for the submit form; the input is checked
// first so an obvious mistake never costs an upload. A success drops the cached deadlines so the
// list shows the assignment as turned in.

import { useCallback, useRef, useState } from 'preact/hooks';
import { checkSubmission, submitAssignment } from '@/services/canvas/submit';
import { forgetDeadlines } from '@/services/hooks/use-deadlines';
import type { SubmissionInput, SubmitTarget } from '@/services/types';

export interface SubmitState {
    sending: boolean;
    error: string | null;
    /** When Canvas recorded the submission, once it has. */
    submittedAt: Date | null;
    /** Check the input before asking the student to confirm; false (with `error` set) if it can't go. */
    review: (input: SubmissionInput) => boolean;
    submit: (input: SubmissionInput) => void;
    clearError: () => void;
}

export function useSubmit(target: SubmitTarget | null): SubmitState {
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
    const inFlight = useRef(false);

    const submit = useCallback(
        (input: SubmissionInput) => {
            if (!target || inFlight.current) return;
            const problem = checkSubmission(target, input);
            if (problem) return setError(problem);
            inFlight.current = true;
            setSending(true);
            setError(null);
            submitAssignment(target, input)
                .then((at) => {
                    forgetDeadlines();
                    setSubmittedAt(at);
                })
                .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
                .finally(() => {
                    inFlight.current = false;
                    setSending(false);
                });
        },
        [target],
    );

    const review = useCallback(
        (input: SubmissionInput) => {
            const problem = target ? checkSubmission(target, input) : 'This assignment is still loading.';
            setError(problem);
            return problem === null;
        },
        [target],
    );

    const clearError = useCallback(() => setError(null), []);
    return { sending, error, submittedAt, review, submit, clearError };
}
