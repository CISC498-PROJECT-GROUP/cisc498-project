// The registered schedule, read from WebReg's own page: GET /registration/schedule/<strm> carries it
// as inline-script vars (var schedule, var term, var maxCredits, …) and lists the terms the student
// may open as the options of <select id="term">. /registration/ redirects to the current term, so the
// URL the request ended on (X-Upstream-Url) says which term that is.
//
// Loading a term's page also makes it WebReg's current term for this session — sisqueue writes act
// on it — which is why every write loads it first (register.ts).

import { mapSchedule } from '@/services/webreg/map-schedule';
import { readVar } from '@/services/webreg/script-vars';
import { WebregError, webregPage } from '@/services/webreg/webreg-api';
import type { RawSchedulePage, RawScheduleEntry, RawTerm } from '@/services/webreg/webreg-types';
import type { WebregSchedule } from '@/services/types/webreg';

/** The vars and term options of a schedule page. Parsed, never run. */
export function readSchedulePage(html: string): RawSchedulePage | null {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const scripts = [...doc.querySelectorAll('script:not([src])')].map((s) => s.textContent ?? '');
    const schedule = readVar(scripts, 'schedule');
    if (!Array.isArray(schedule)) return null;
    const terms = [...doc.querySelectorAll<HTMLOptionElement>('select#term option')].map((o) => ({ strm: o.value.trim(), label: (o.textContent ?? '').trim() })).filter((t) => t.strm);
    return {
        schedule: schedule as RawScheduleEntry[],
        term: (readVar(scripts, 'term') ?? {}) as RawTerm,
        maxCredits: readVar(scripts, 'maxCredits'),
        totalCredits: readVar(scripts, 'totalCredits'),
        readOnly: readVar(scripts, 'readOnly'),
        isAddPossible: readVar(scripts, 'isAddPossible'),
        swapOnly: readVar(scripts, 'swapOnly'),
        terms,
    };
}

/** The term a schedule URL is for: /registration/schedule/2273 → "2273". */
export const strmOf = (url: string): string | null => /\/registration\/schedule\/(\d{4})\b/.exec(new URL(url).pathname)?.[1] ?? null;

/** A term's registered schedule; `strm` null opens the current term. */
export async function loadSchedule(strm: string | null): Promise<WebregSchedule> {
    const { html, url } = await webregPage(strm ? `schedule/${strm}` : '');
    const page = readSchedulePage(html);
    const term = strmOf(url) ?? page?.term.strm ?? strm;
    if (new URL(url).hostname !== 'webreg.nss.udel.edu' || !page || !term) throw new WebregError("WebReg didn't open your schedule — it may need you to sign in again.");
    return mapSchedule(page, term);
}
