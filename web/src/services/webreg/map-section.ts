// WebReg's lookups → search results and section detail: lookupCourses' {label, value} items (a
// course list, or a course's sections), and lookupCourseInfo's one section with its required
// components and the sections that satisfy them (assoc). Pure.

import { bool, courseTitle, mapCreditOptions, mapGradeOptions, mapInstructors, mapMeetings, number, str } from '@/services/webreg/map-common';
import { courseCode, isLabId, isSectionId, sectionCode } from '@/services/webreg/section-id';
import { sectionIdOf } from '@/services/webreg/map-schedule';
import { parseClock, parseDays } from '@/services/webreg/times';
import type { RawAssocItem, RawLookupItem, RawSectionInfo } from '@/services/webreg/webreg-types';
import type { ComponentSection, RequiredComponent, SearchResult, Seats, SectionInfo } from '@/services/types/webreg';

/** lookupCourses' items: sections when every value is a section id, otherwise courses. */
export function mapLookup(items: RawLookupItem[] | undefined, prefix: string): SearchResult {
    const valid = (Array.isArray(items) ? items : []).filter((i): i is { label: string; value: string } => typeof i?.value === 'string' && i.value.length > 0).map((i) => ({ label: String(i.label ?? i.value), value: i.value.toUpperCase() }));
    if (valid.length && valid.every((i) => isSectionId(i.value))) {
        const sections = valid.map((i) => ({ id: i.value, code: sectionCode(i.value), status: /\(([^)]*)\)/.exec(i.label)?.[1] ?? '', lab: isLabId(i.value) }));
        return { kind: 'sections', courseId: prefix, sections };
    }
    return { kind: 'courses', courses: valid.map((i) => ({ id: i.value, code: courseCode(i.value), title: courseTitle(i.label) })) };
}

/** WebReg reports whether a section is full, never how many seats it has. */
const NO_COUNTS: Seats = { open: null, capacity: null };

/** "… F 12:40 PM - 1:35 PM (Open Seats)" → the meeting in it, if it has one. */
function meetingIn(descr: string): ComponentSection['meetings'] {
    const m = /\s([MTWRFSU](?:\s?[MTWRFSU])*)\s+(\d{1,2}:\d{2}\s?[AP]M)\s*-\s*(\d{1,2}:\d{2}\s?[AP]M)/.exec(descr);
    const days = m ? parseDays(m[1]!.replace(/\s/g, '').split('')) : [];
    const start = m ? parseClock(m[2]) : null;
    const end = m ? parseClock(m[3]) : null;
    return days.length && start && end ? [{ days, start, end, location: null, startDate: null, endDate: null }] : [];
}

/** One of assoc.LAB's {descr, value} items: its time and seat status come from the description. */
export function mapComponentSection(raw: RawAssocItem): ComponentSection {
    const id = (str(raw.value) ?? '').toUpperCase();
    const descr = str(raw.descr) ?? '';
    return { id, code: sectionCode(id), meetings: meetingIn(descr), instructors: [], full: /\((closed|full|wait)[^)]*\)\s*$/i.test(descr), seats: NO_COUNTS };
}

function mapRequired(raw: RawSectionInfo): RequiredComponent[] {
    return (Array.isArray(raw.components) ? raw.components : [])
        .filter((c) => str(c?.type))
        .map((c) => {
            const type = String(c.type).toUpperCase();
            const candidates = (raw.assoc?.[type] ?? []).map(mapComponentSection).filter((s) => s.id);
            return { type, optional: bool(c.optional), candidates };
        });
}

const notes = (raw: RawSectionInfo['notes']): string[] => (Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/\n+/) : []).map((n) => String(n).trim()).filter(Boolean);

export function mapSectionInfo(raw: RawSectionInfo, id: string): SectionInfo {
    const sectionId = sectionIdOf(raw) || id.toUpperCase();
    return {
        id: sectionId,
        code: sectionCode(sectionId),
        course: courseCode(sectionId),
        title: courseTitle(str(raw.descr) ?? ''),
        component: str(raw.type) ?? (isLabId(sectionId) ? 'LAB' : 'LEC'),
        creditOptions: mapCreditOptions(raw.creditOpt),
        gradeOptions: mapGradeOptions(raw.gradeOptions),
        meetings: mapMeetings(raw.calendar),
        instructors: mapInstructors(raw.instructors),
        full: bool(raw.full),
        seats: NO_COUNTS,
        waitlistPossible: bool(raw.waitlistPossible),
        waitlistTotal: number(raw.waitlistTotal) ?? 0,
        required: mapRequired(raw),
        notes: notes(raw.notes),
        description: str(raw.longDescr) ?? '',
        status: str(raw.status) ?? '',
    };
}
