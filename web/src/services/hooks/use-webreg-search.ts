// The search panel's data: WebReg's course lookup as the student types (debounced, so a word typed
// fast is one request), a course's sections with their detail, and one section in full. Section
// detail is kept for a minute, so hovering a result, opening it and planning it ask WebReg once.

import { useEffect, useState } from 'preact/hooks';
import { useLoad } from '@/services/hooks/use-load';
import { courseSections, searchCourses, sectionInfo } from '@/services/webreg/lookups';
import { searchPrefix } from '@/services/webreg/section-id';
import type { Loadable } from '@/services/types';
import type { SearchResult, SectionInfo } from '@/services/types/webreg';

const FRESH_MS = 60_000;
const cache = new Map<string, { at: number; value: Promise<unknown> }>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < FRESH_MS) return hit.value as Promise<T>;
    const value = load().catch((error) => {
        cache.delete(key);
        throw error;
    });
    cache.set(key, { at: Date.now(), value });
    return value;
}

export function useDebounced<T>(value: T, ms: number): T {
    const [settled, setSettled] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setSettled(value), ms);
        return () => clearTimeout(timer);
    }, [value, ms]);
    return settled;
}

const NOTHING: SearchResult = { kind: 'courses', courses: [] };

export function useCourseSearch(strm: string, query: string): Loadable<SearchResult> & { prefix: string } {
    const prefix = searchPrefix(useDebounced(query, 250));
    const state = useLoad(() => (prefix.length < 2 ? Promise.resolve(NOTHING) : cached(`find|${strm}|${prefix}`, () => searchCourses(strm, prefix))), NOTHING, `${strm}|${prefix}`);
    return { ...state, prefix };
}

export const useCourseSections = (strm: string, courseId: string | null): Loadable<SectionInfo[]> =>
    useLoad(() => (courseId ? cached(`course|${strm}|${courseId}`, () => courseSections(strm, courseId)) : Promise.resolve([])), [], `${strm}|${courseId}`);

export const useSectionInfo = (strm: string, id: string | null): Loadable<SectionInfo | null> => useLoad(() => (id ? cached(`section|${strm}|${id}`, () => sectionInfo(strm, id)) : Promise.resolve(null)), null, `${strm}|${id}`);

/** Forget cached lookups — after a registration changes seat counts. */
export const clearSearchCache = (): void => cache.clear();
