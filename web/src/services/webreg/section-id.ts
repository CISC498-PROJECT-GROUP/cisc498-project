// WebReg's ids, no spaces: a course is subject + number ("CISC108"), a section adds its number
// ("CISC108010", a lab "CISC108020L"). The site shows them the way UD prints them: "CISC 108" and
// "CISC 108-010". Pure.

const SECTION = /^([A-Z]{2,4})(\d{3}[A-Z]?)(\d{3}L?)$/;
const COURSE = /^([A-Z]{2,4})(\d{3}[A-Z]?)$/;

export interface SectionParts {
    subject: string;
    number: string;
    section: string;
}

export function parseSectionId(id: string): SectionParts | null {
    const m = SECTION.exec(id.trim().toUpperCase());
    return m ? { subject: m[1], number: m[2], section: m[3] } : null;
}

export const isSectionId = (id: string): boolean => parseSectionId(id) !== null;

export const isLabId = (id: string): boolean => /L$/.test(parseSectionId(id)?.section ?? '');

/** "CISC108010" → "CISC 108-010"; anything unrecognised is shown as given. */
export function sectionCode(id: string): string {
    const p = parseSectionId(id);
    return p ? `${p.subject} ${p.number}-${p.section}` : id;
}

/** The course a section id belongs to: "CISC108010" → "CISC108". */
export function courseIdOf(id: string): string {
    const p = parseSectionId(id);
    return p ? `${p.subject}${p.number}` : id;
}

/** "CISC108" (or a section id) → "CISC 108". */
export function courseCode(id: string): string {
    const p = parseSectionId(id);
    if (p) return `${p.subject} ${p.number}`;
    const c = COURSE.exec(id.trim().toUpperCase());
    return c ? `${c[1]} ${c[2]}` : id;
}

/** What the student typed as WebReg's lookup prefix: "cisc 1" → "CISC1", "CISC 108-010" → "CISC108010". */
export const searchPrefix = (query: string): string => query.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** A course code in any spacing ("CISC 108", "cisc108") as a comparable key. */
export const courseKey = (code: string): string => searchPrefix(code);
