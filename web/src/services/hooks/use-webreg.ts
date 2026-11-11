// The student's WebReg registration for a term — the schedule page's sections, term windows, credit
// limit and the terms they may open — and the corequisites a drop would take with it. `strm` null
// opens WebReg's current term (where /registration/ redirects).

import { useLoad } from '@/services/hooks/use-load';
import { corequisites } from '@/services/webreg/lookups';
import { loadSchedule } from '@/services/webreg/schedule-page';
import type { Loadable } from '@/services/types';
import type { WebregSchedule } from '@/services/types/webreg';

export const useWebregSchedule = (strm: string | null): Loadable<WebregSchedule | null> => useLoad(() => loadSchedule(strm), null, strm);

async function loadCorequisites(ids: string[]): Promise<Record<string, string[]>> {
    const found = await Promise.all(ids.map(async (id) => [id, await corequisites(id)] as const));
    return Object.fromEntries(found);
}

/** For each section to be dropped, the sections WebReg says go with it. */
export const useCorequisites = (ids: string[]): Loadable<Record<string, string[]> | null> => useLoad(() => loadCorequisites(ids), null, ids.join(','));
