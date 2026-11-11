// Carrying out confirmed registration changes: the writes run one at a time, in order, each showing
// WebReg's own answer as it lands. When WebReg refuses one (or can't be reached), the writes after it
// are not sent — the student sees where things stand and decides again. `run` is called only from the
// review dialog's confirm; nothing else in the site writes to WebReg.

import { useCallback, useRef, useState } from 'preact/hooks';
import { clearSearchCache } from '@/services/hooks/use-webreg-search';
import { runWrite } from '@/services/webreg/register';
import type { StepOutcome, WriteStep } from '@/services/types/webreg';

export interface Registration {
    outcomes: StepOutcome[];
    running: boolean;
    /** True once a run has finished (whatever WebReg said). */
    finished: boolean;
    run: (strm: string, steps: WriteStep[]) => Promise<void>;
    reset: () => void;
}

export function useRegistration(onFinished?: () => void): Registration {
    const [outcomes, setOutcomes] = useState<StepOutcome[]>([]);
    const [running, setRunning] = useState(false);
    const busy = useRef(false);

    const run = useCallback(
        async (strm: string, steps: WriteStep[]) => {
            if (busy.current || !steps.length) return;
            busy.current = true;
            setRunning(true);
            const list: StepOutcome[] = steps.map((step) => ({ step, status: 'waiting', result: null, error: null }));
            const update = (i: number, change: Partial<StepOutcome>) => {
                list[i] = { ...list[i], ...change };
                setOutcomes([...list]);
            };
            setOutcomes([...list]);
            let stopped = false;
            for (let i = 0; i < steps.length; i++) {
                if (stopped) {
                    update(i, { status: 'skipped' });
                    continue;
                }
                update(i, { status: 'running' });
                try {
                    const result = await runWrite(strm, steps[i]);
                    update(i, { status: result.successful ? 'done' : 'failed', result });
                    stopped = !result.successful;
                } catch (error) {
                    update(i, { status: 'failed', error: error instanceof Error ? error.message : String(error) });
                    stopped = true;
                }
            }
            clearSearchCache();
            busy.current = false;
            setRunning(false);
            onFinished?.();
        },
        [onFinished],
    );

    const reset = useCallback(() => {
        if (!busy.current) setOutcomes([]);
    }, []);

    return { outcomes, running, finished: outcomes.length > 0 && !running, run, reset };
}
