import { describe, expect, it } from 'bun:test';
import { courseKey, joinTerm, otherCanvas } from '@/services/dashboard/course-match';
import { isWork } from '@/services/dashboard/work';
import type { Course, Deadline } from '@/services/types';
import type { Term } from '@/services/types/stellic';

// The dashboard's one join: a Stellic course to its Canvas site, by subject and number.

const course = (id: string, code: string, term: string | null = null): Course => ({ id, code, name: code, color: '#000', term, teachers: [], percent: null, letter: null, url: `https://canvas.example.edu/courses/${id}` });
const due = (id: string, courseId: string, at: string, submitted = false): Deadline => ({ id, courseId, courseName: null, title: id, dueAt: new Date(at), points: null, url: null, kind: 'assignment', assignmentId: id, submitted, missing: false });

const term: Term = {
    label: 'Fall 2026',
    season: 'Fall',
    year: 2026,
    start: '2026-08-25',
    end: '2026-12-17',
    when: 'current',
    courses: [
        { code: 'CISC 304', name: 'Logic for Programming', credits: 3, grade: null, status: 'enrolled', statusLabel: 'Enrolled' },
        { code: 'MATH 231', name: 'Integrated Calculus IA', credits: 4, grade: null, status: 'enrolled', statusLabel: 'Enrolled' },
        { code: 'CISC 498', name: 'Computer Science Senior Design Project I', credits: 3, grade: null, status: 'enrolled', statusLabel: 'Enrolled' },
    ],
};

describe('courseKey', () => {
    it('reads the subject and number from either system', () => {
        expect(courseKey('CISC 304')).toBe('CISC 304');
        expect(courseKey('26F-CISC304-010')).toBe('CISC 304');
        expect(courseKey('24F-MATH231-010 & -011')).toBe('MATH 231');
        expect(courseKey('26F-CISC498')).toBe('CISC 498');
        expect(courseKey('cisc 220')).toBe('CISC 220');
    });

    it('finds nothing in a site without a course number', () => {
        expect(courseKey('Career Center: Section 004')).toBeNull();
        expect(courseKey('Makerspace')).toBeNull();
        expect(courseKey(null)).toBeNull();
    });
});

describe('joinTerm', () => {
    const now = new Date('2026-11-04T12:00:00');
    const canvas = [course('1', '24F-MATH231-010 & -011', 'Fall 2024'), course('2', '26F-CISC304-010', 'Fall 2026'), course('3', '26F-MATH231-012', 'Fall 2026'), course('4', 'Makerspace')];
    const deadlines = [due('old', '2', '2026-11-01T12:00:00'), due('done', '2', '2026-11-05T12:00:00', true), due('hw3', '2', '2026-11-06T12:00:00'), due('hw4', '2', '2026-11-09T12:00:00')];
    const rows = joinTerm(term, canvas, deadlines, now);

    it('matches each Stellic course to its Canvas site, preferring this term on a retake', () => {
        expect(rows.map((r) => r.canvas?.id ?? null)).toEqual(['2', '3', null]);
    });

    it('leads with the next open item and counts the rest', () => {
        expect(rows[0]!.next?.id).toBe('hw3');
        expect(rows[0]!.openCount).toBe(2);
        expect(rows[1]!.next).toBeNull();
    });

    it('lists the Canvas sites that belong to no course this term', () => {
        expect(otherCanvas(rows, canvas).map((c) => c.id)).toEqual(['1', '4']);
    });
});

describe('isWork', () => {
    it('keeps work and drops dated items with nothing to hand in', () => {
        const kinds = ['assignment', 'quiz', 'discussion_topic', 'announcement', 'calendar_event', 'planner_note'];
        expect(kinds.filter((kind) => isWork({ ...due('x', '1', '2026-11-05T12:00:00'), kind }))).toEqual(['assignment', 'quiz', 'discussion_topic', 'planner_note']);
    });
});
