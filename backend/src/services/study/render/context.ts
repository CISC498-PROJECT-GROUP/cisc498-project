// What every page of a document renders against: the document, lookups into it, and the block
// context (quote labels, diagram ids). Built once per render.

import type { LectureRef, PlanUnit, StudyDocument, StudyLink } from '@canvas-assistant/shared';
import { saidLabeller, surname, type BlockContext } from '@/services/study/render/blocks';
import { shortDate } from '@/services/study/render/html';
import { NAVY, unitTheme, type UnitTheme } from '@/services/study/render/theme';

export interface DocContext extends BlockContext {
    doc: StudyDocument;
    /** The instructor's surname, or '' when the course lists none. */
    who: string;
    lecturesOf: (unit: PlanUnit) => LectureRef[];
    linksOf: (section: string) => StudyLink[];
    /** The theme of the unit whose number begins `label` ("2 · Know your data"), else navy. */
    themeFor: (label: string) => UnitTheme;
}

export const themeStyle = (theme: UnitTheme): string => `--u:${theme.main};--ut:${theme.tint};--us:${theme.soft}`;

/** "Lectures Aug 31 · Sep 2 · Sep 9" — the unit band's chip. */
export const lectureDates = (lectures: LectureRef[]): string => {
    const days = [...new Set(lectures.map((l) => l.date).filter(Boolean))].sort();
    return days.length === 0 ? '' : `${days.length === 1 ? 'Lecture' : 'Lectures'} ${days.map(shortDate).join(' · ')}`;
};

export function docContext(doc: StudyDocument): DocContext {
    const byId = new Map(doc.lectures.map((lecture) => [lecture.id, lecture]));
    const links = new Map(doc.links.map((entry) => [entry.number, entry.links]));
    let ids = 0;
    return {
        doc,
        who: surname(doc.course.instructor),
        saidLabel: saidLabeller(doc.course.instructor),
        nextId: () => `d${++ids}`,
        lecturesOf: (unit) =>
            unit.lecture_ids
                .map((id) => byId.get(id))
                .filter((l): l is LectureRef => l !== undefined)
                .sort((a, b) => a.date.localeCompare(b.date)),
        linksOf: (section) => links.get(section) ?? [],
        themeFor: (label) => {
            const index = doc.plan.units.findIndex((u) => label.trim().startsWith(`${u.number} `) || label.trim() === u.number || label.includes(u.title));
            return index === -1 ? NAVY : unitTheme(index);
        },
    };
}
