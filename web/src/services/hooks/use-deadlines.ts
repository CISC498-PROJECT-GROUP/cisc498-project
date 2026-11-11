// Everything due in the next two weeks across all courses, soonest first, from the planner.
//
// Home (for its at-a-glance counts) and the deadlines view both read this, usually seconds apart,
// so the request is shared for a short while rather than made twice.

import { fetchPlanner } from '@/services/canvas/planner';
import { useLoad } from '@/services/hooks/use-load';
import type { Deadline, Loadable } from '@/services/types';

export const WINDOW_DAYS = 14;
const FRESH_MS = 2 * 60 * 1000;

let cached: { at: number; promise: Promise<Deadline[]> } | null = null;

function loadDeadlines(): Promise<Deadline[]> {
    if (cached && Date.now() - cached.at < FRESH_MS) return cached.promise;
    const promise = fetchPlanner(WINDOW_DAYS, 3).catch((error) => {
        cached = null;
        throw error;
    });
    cached = { at: Date.now(), promise };
    return promise;
}

/** Drop the shared result so the next view to ask reloads it — after a submission changes it. */
export const forgetDeadlines = (): void => {
    cached = null;
};

export const useDeadlines = (): Loadable<Deadline[]> => useLoad(loadDeadlines, []);
