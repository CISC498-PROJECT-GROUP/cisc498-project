import { describe, expect, it } from 'bun:test';
import { creditProgram, mapAudit, tidyProgramName } from '@/services/stellic/audit';
import { currentTerm, mapPlan, nextTerm } from '@/services/stellic/plan';
import { mapProfile, mapReview } from '@/services/stellic/profile';
import { parseStellicJson } from '@/services/stellic/stellic-api';

// Shapes follow what UD's Stellic returns (trimmed to the fields read); the values are made up.

describe('parseStellicJson', () => {
    it('strips the anti-hijacking prefix', () => {
        expect(parseStellicJson(")]}',\n{\"success\": true}")).toEqual({ success: true });
        expect(parseStellicJson('{"a":1}')).toEqual({ a: 1 });
    });
});

const dates = (start: string, end: string) => ({ start_date: start, end_date: end });

describe('mapPlan', () => {
    const plan = mapPlan(
        {
            student_plan: {
                plan_id: 'p1',
                programs: [{ name: 'Computer Science Major (CS-BS)' }],
                sem_content: [
                    {
                        id: 1,
                        content: {
                            '1': { physical_year: 2025, semester_dates: dates('2025-08-26', '2025-12-18'), courses: [{ code: 'CISC 220', name: 'Data Structures', units: 3, grade: 'A', is_registered: true }] },
                            '2': { physical_year: 2026, semester_dates: dates('2026-08-25', '2026-12-17'), courses: [{ code: 'CISC 304', units: 3, grade: '', is_registered: true, registration_status: { screen_name: 'Enrolled' } }] },
                        },
                    },
                    { id: 2, content: { '1': { physical_year: 2027, semester_dates: dates('2027-01-04', '2027-02-10'), courses: [] } } },
                    { id: 3, content: { '1': { physical_year: 2027, semester_dates: dates('2027-02-08', '2027-06-01'), courses: [{ code: 'CISC 481', units: 3, is_registered: false }] } } },
                ],
            },
        },
        new Date('2026-11-04T12:00:00'),
    );

    it('orders the terms that have courses and labels them by season and year', () => {
        expect(plan.terms.map((t) => `${t.label}:${t.when}`)).toEqual(['Fall 2025:past', 'Fall 2026:current', 'Spring 2027:future']);
        expect(plan.planId).toBe('p1');
        expect(plan.programs).toEqual(['Computer Science Major (CS-BS)']);
    });

    it('marks each course completed, enrolled or planned from Stellic’s grade and registration', () => {
        expect(plan.terms.map((t) => t.courses[0]!.status)).toEqual(['completed', 'enrolled', 'planned']);
        expect(plan.terms[0]!.courses[0]!.grade).toBe('A');
        expect(plan.terms[1]!.courses[0]!.statusLabel).toBe('Enrolled');
    });

    it('finds the current and the next term', () => {
        expect(currentTerm(plan)?.label).toBe('Fall 2026');
        expect(nextTerm(plan)?.label).toBe('Spring 2027');
    });
});

describe('mapAudit', () => {
    const units = (taken: number, in_progress: number, remaining: number) => ({ progress_data: { units_summary: { taken, in_progress, remaining } } });
    const audit = mapAudit({
        req_tree: {
            programs: [
                { id: 10, screen_name: 'Computer Science Major (CS-BS)', choices: [{ id: 11, screen_name: 'Capstone Requirement', choices: [] }, { id: 12, screen_name: 'Technical Electives' }, { id: 7746 }] },
                { id: 20, screen_name: 'Computer Science Major (CS-BS) Minimum Total Credits 2019F', choices: [{ id: 21, screen_name: 'Total Credits' }] },
                { id: 30, screen_name: 'University Requirements (17F-current)' },
            ],
        },
        audit_data: {
            '10': { satisfied: false, ...units(77, 12, 15), cards_remaining: [{ requirement_id: 11, units: 3 }, { requirement_id: 12, units: 3 }, { requirement_id: 12, units: 3 }] },
            '20': { satisfied: false, ...units(96, 15, 13), cards_remaining: [{ requirement_id: 21, units: 3 }] },
            '30': { satisfied: true, ...units(90, 3, 0) },
        },
        student_audit: { grades_summary: { c_gpa: 3.5 } },
    });

    it('reports each program with Stellic’s own status and credit figures', () => {
        expect(audit.gpa).toBe(3.5);
        expect(audit.programs.map((p) => [p.name, p.satisfied])).toEqual([
            ['Computer Science Major (CS-BS)', false],
            ['Computer Science Major (CS-BS) Minimum Total Credits', false],
            ['University Requirements', true],
        ]);
        expect(audit.programs[0]!.credits).toEqual({ taken: 77, inProgress: 12, remaining: 15 });
    });

    it('names the open requirements and folds repeats together', () => {
        expect(audit.programs[0]!.open).toEqual([
            { name: 'Capstone Requirement', count: 1, credits: 3 },
            { name: 'Technical Electives', count: 2, credits: 6 },
        ]);
        expect(audit.programs[2]!.open).toEqual([]);
    });

    it('draws the credit bar from the credit-minimum program', () => {
        expect(creditProgram(audit)?.id).toBe('20');
        expect(tidyProgramName('University Requirements (17F-current)')).toBe('University Requirements');
    });
});

describe('mapProfile / mapReview', () => {
    it('reads standing, graduation term and advisors', () => {
        const profile = mapProfile({ first_name: 'Sam', last_name: 'Student', level_name: 'Senior', expected_graduation_usem: { semester: 3, year: 2027 }, primary_advisor: null, secondary_advisors: [{ first_name: 'Ada', last_name: 'Advisor', email: 'ada@example.edu' }] });
        expect(profile).toEqual({ name: 'Sam Student', standing: 'Senior', school: null, graduation: 'Spring 2027', advisors: [{ name: 'Ada Advisor', email: 'ada@example.edu' }] });
    });

    it('reads an open plan review', () => {
        expect(mapReview({ data: { is_plan_reviewed: false, open_review_details: { reviewer: { first_name: 'Ada', last_name: 'Advisor' }, review_initiated_at: '2025-11-11T17:12:47Z' } } })).toEqual({ reviewed: false, openWith: 'Ada Advisor', openSince: '2025-11-11T17:12:47Z' });
    });
});
