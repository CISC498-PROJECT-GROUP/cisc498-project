// WebReg's reads behind the search panel and the confirm dialog — all GETs, all for one term:
// lookupCourses (search as you type: a course list, or a whole course's sections), lookupCourseInfo
// (one section in full) and check (the corequisites a drop takes with it).

import { mapLookup, mapSectionInfo } from '@/services/webreg/map-section';
import { isLabId, searchPrefix } from '@/services/webreg/section-id';
import { webregGet } from '@/services/webreg/webreg-api';
import type { RawLookupItem, RawSectionInfo } from '@/services/webreg/webreg-types';
import type { SearchResult, SectionInfo } from '@/services/types/webreg';

const enc = encodeURIComponent;

/** "CISC 1" → the courses starting CISC1; "CISC108" → its sections. Under two letters, nothing. */
export async function searchCourses(strm: string, query: string): Promise<SearchResult> {
    const prefix = searchPrefix(query);
    if (prefix.length < 2) return { kind: 'courses', courses: [] };
    const found = await webregGet<{ items?: RawLookupItem[] } | null>(`lookupCourses/${enc(strm)}/${enc(prefix)}`);
    return mapLookup(found?.items, prefix);
}

export async function sectionInfo(strm: string, id: string): Promise<SectionInfo> {
    const raw = await webregGet<RawSectionInfo | null>(`lookupCourseInfo/${enc(strm)}/${enc(id)}`);
    return mapSectionInfo(raw ?? {}, id);
}

/** Every lecture-type section of a course with its detail — the search panel's section list. Labs
    are left out; they are picked inside a lecture's detail, from the sections WebReg pairs with it. */
export async function courseSections(strm: string, courseId: string): Promise<SectionInfo[]> {
    const found = await searchCourses(strm, courseId);
    if (found.kind !== 'sections') return [];
    const ids = found.sections.filter((s) => !isLabId(s.id)).map((s) => s.id);
    return Promise.all(ids.map((id) => sectionInfo(strm, id)));
}

/** The section ids a drop of `id` would also drop. */
export async function corequisites(id: string): Promise<string[]> {
    const found = await webregGet<{ corequisites?: unknown[] } | null>(`check/${enc(id)}`);
    return (found?.corequisites ?? []).map((c) => (typeof c === 'string' ? c : String((c as { section?: string })?.section ?? ''))).filter(Boolean);
}
