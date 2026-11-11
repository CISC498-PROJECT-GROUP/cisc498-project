// Finding a section: type a subject or course ("CISC 1", "CISC108") and WebReg's own lookup answers
// as you type — courses first, then a course's sections, then one section in full with its required
// lab to pick and an "Add to plan". Hovering or focusing a section previews it on the calendar.

import { useEffect, useState } from 'preact/hooks';
import { LoadState } from '@/components/common/load-state';
import { SectionDetail } from '@/components/schedule/section-detail';
import { SectionList } from '@/components/schedule/section-list';
import { useCourseSearch } from '@/services/hooks/use-webreg-search';
import { courseIdOf, courseKey } from '@/services/webreg/section-id';
import type { CalendarItem } from '@/services/webreg/calendar';
import type { Timed } from '@/services/webreg/conflicts';
import type { ComponentSection, SectionInfo } from '@/services/types/webreg';

export interface SearchPanelProps {
    strm: string;
    query: string;
    onQuery: (query: string) => void;
    /** Sections on the schedule (registered and planned), to flag conflicts against. */
    taken: Timed[];
    /** By courseKey ("CISC108"): "Registered" or "In plan". */
    status: Map<string, string>;
    canAdd: boolean;
    onPreview: (item: Omit<CalendarItem, 'kind'> | null) => void;
    onPlan: (info: SectionInfo, components: { type: string; section: ComponentSection }[]) => void;
}

export function SearchPanel(props: SearchPanelProps) {
    const { strm, query, onQuery } = props;
    const search = useCourseSearch(strm, query);
    const [picked, setPicked] = useState<string | null>(null);
    const [open, setOpen] = useState<SectionInfo | null>(null);

    useEffect(() => {
        setPicked(null);
        setOpen(null);
    }, [query, strm]);

    const found = search.data;
    const courseId = picked ?? (found.kind === 'sections' ? courseIdOf(found.courseId) : null);
    const typed = search.prefix.length >= 2;

    return (
        <section class="ca-dash-card ca-search" aria-labelledby="ca-search-title">
            <div class="ca-dash-card-head">
                <h2 class="ca-dash-card-title" id="ca-search-title">
                    Find a class
                </h2>
                <span class="ca-source ca-source--webreg">WebReg</span>
            </div>
            <label class="ca-search-field">
                <span class="ca-sr-only">Course or subject</span>
                <input class="ca-field" type="search" placeholder="Try CISC 1 or MATH241" value={query} autoComplete="off" spellcheck={false} onInput={(e) => onQuery((e.target as HTMLInputElement).value)} />
            </label>
            {open ? (
                <SectionDetail {...props} info={open} onBack={() => setOpen(null)} />
            ) : courseId ? (
                <SectionList {...props} courseId={courseId} onBack={found.kind === 'courses' ? () => setPicked(null) : null} onOpen={setOpen} />
            ) : !typed ? (
                <p class="ca-empty-line">Search UD's course list for this term by subject, course or section.</p>
            ) : search.loading || search.error ? (
                <LoadState state={search} rows={3} />
            ) : found.kind === 'courses' && found.courses.length ? (
                <ul class="ca-search-list">
                    {found.courses.map((c) => (
                        <li key={c.id}>
                            <button type="button" class="ca-search-course" onClick={() => setPicked(c.id)}>
                                <span class="ca-search-code">{c.code}</span>
                                <span class="ca-search-title">{c.title}</span>
                                {props.status.get(courseKey(c.code)) && <span class="ca-tag">{props.status.get(courseKey(c.code))}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p class="ca-empty-line">WebReg has nothing starting “{search.prefix}” this term.</p>
            )}
        </section>
    );
}
