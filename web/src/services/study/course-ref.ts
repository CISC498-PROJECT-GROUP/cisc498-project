// How a course is named on a study PDF. Canvas codes and names often carry the term and section
// ("26F-CISC304-010", "26F-CISC304-010: Logic for Programming"); the guide wants "CISC304" and
// "Logic for Programming". The instructor is named only when the course lists exactly one.

import type { CourseRef } from '@canvas-assistant/shared';
import type { Course } from '@/services/types';

/** "26F-CISC304-010" → "CISC304"; a code without a subject-and-number keeps its own form. */
export const shortCode = (code: string): string => {
    const match = /\b([A-Z]{2,5})[\s-]?(\d{3}[A-Z]?)\b/.exec(code);
    return match ? `${match[1]}${match[2]}` : code.trim();
};

/** "26F-CISC304-010: Logic for Programming" → "Logic for Programming"; a name that is only a code → ''. */
export const shortName = (name: string): string => {
    const titled = /^[^:]*\d{3}[^:]*:\s*(.+)$/.exec(name)?.[1] ?? name;
    return /^[\dA-Z]{2,4}-[A-Z]{2,5}\d{3}/.test(titled.trim()) ? '' : titled.trim();
};

export const courseRef = (course: Course): CourseRef => ({ code: shortCode(course.code), name: shortName(course.name), instructor: course.teachers.length === 1 ? course.teachers[0]!.name : '' });
