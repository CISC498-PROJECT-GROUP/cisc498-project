// Everything due in the next two weeks across all courses, soonest first, from the planner.

import { fetchPlanner } from '@/services/canvas/planner';
import { useLoad } from '@/services/hooks/use-load';
import type { Deadline, Loadable } from '@/services/types';

export const WINDOW_DAYS = 14;

export const useDeadlines = (): Loadable<Deadline[]> => useLoad(() => fetchPlanner(WINDOW_DAYS), []);
