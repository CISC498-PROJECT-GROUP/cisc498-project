// The student's planned schedule for a term — a draft kept in their browser's localStorage, one per
// term, until they register it. A per-viewer convenience: storage may be blocked or cleared, so every
// access is guarded and the plan simply starts empty. Never the record — WebReg is.

import { useCallback, useEffect, useState } from 'preact/hooks';
import { addToDraft, EMPTY_DRAFT, pruneDraft, readDraft, removeAdd, setWaitlist, toggleDrop, updateSection } from '@/services/webreg/plan-draft';
import type { PlanDraft, PlannedAdd, PlannedSection } from '@/services/types/webreg';

const storageKey = (strm: string) => `ca-webreg-plan:${strm}`;

function load(strm: string | null): PlanDraft {
    if (!strm) return EMPTY_DRAFT;
    try {
        const text = localStorage.getItem(storageKey(strm));
        return text ? readDraft(JSON.parse(text)) : EMPTY_DRAFT;
    } catch {
        return EMPTY_DRAFT;
    }
}

function save(strm: string, draft: PlanDraft): void {
    try {
        if (!draft.adds.length && !draft.drops.length) localStorage.removeItem(storageKey(strm));
        else localStorage.setItem(storageKey(strm), JSON.stringify(draft));
    } catch {
        /* storage blocked — the plan lives for this page only */
    }
}

export interface PlanActions {
    draft: PlanDraft;
    add: (add: PlannedAdd) => void;
    remove: (key: string) => void;
    toggleDrop: (id: string) => void;
    update: (key: string, id: string, change: Partial<Pick<PlannedSection, 'credits' | 'gradeOption'>>) => void;
    setWaitlist: (key: string, waitlist: boolean) => void;
    prune: (registeredIds: string[]) => void;
    clear: () => void;
}

export function usePlanDraft(strm: string | null): PlanActions {
    const [state, setState] = useState<{ strm: string | null; draft: PlanDraft }>(() => ({ strm, draft: load(strm) }));
    const draft = state.strm === strm ? state.draft : load(strm);

    useEffect(() => {
        if (state.strm !== strm) setState({ strm, draft: load(strm) });
    }, [strm]);

    const change = useCallback(
        (next: (d: PlanDraft) => PlanDraft) =>
            setState((s) => {
                const base = s.strm === strm ? s.draft : load(strm);
                const updated = next(base);
                if (strm) save(strm, updated);
                return { strm, draft: updated };
            }),
        [strm],
    );

    return {
        draft,
        add: useCallback((add) => change((d) => addToDraft(d, add)), [change]),
        remove: useCallback((key) => change((d) => removeAdd(d, key)), [change]),
        toggleDrop: useCallback((id) => change((d) => toggleDrop(d, id)), [change]),
        update: useCallback((key, id, c) => change((d) => updateSection(d, key, id, c)), [change]),
        setWaitlist: useCallback((key, w) => change((d) => setWaitlist(d, key, w)), [change]),
        prune: useCallback((ids) => change((d) => pruneDraft(d, ids)), [change]),
        clear: useCallback(() => change(() => EMPTY_DRAFT), [change]),
    };
}
