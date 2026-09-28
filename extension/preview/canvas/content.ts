// Preview fixtures: pages, modules and files. MATH 242 keeps its syllabus in a PAGE and ENGL 110 in
// a PDF inside a module (with the Pages list hidden), so the assistant has to go looking.

import { textPdf } from './pdf';

export const PAGES: Record<number, { title: string; url: string; updated_at: string; body: string }[]> = {
    102: [
        {
            title: 'Course Syllabus',
            url: 'course-syllabus',
            updated_at: '2026-08-25T14:00:00Z',
            body: `<p>MATH 242 — Calculus II. Dr. Ray Okafor.</p><p>Office hours: Mondays and Wednesdays 11 AM – 12 PM in Ewing 312.</p>
<p>Grading: Problem Sets 30%, Exams 50% (Exam 1, Exam 2, and the cumulative Final), Participation 20%.</p>
<p>Late problem sets are accepted up to 48 hours late for 75% credit. Exams cannot be made up without a Dean's excuse. Calculators are not allowed on exams.</p>`,
        },
        { title: 'Welcome', url: 'welcome', updated_at: '2026-08-20T14:00:00Z', body: '<p>Welcome to Calculus II! Start with the Course Syllabus page.</p>' },
    ],
};

export const HIDDEN_PAGES = new Set([103]);

export const MODULES: Record<number, unknown[]> = {
    103: [
        {
            name: 'Start Here',
            items: [
                { title: 'ENGL 110 Syllabus (PDF)', type: 'File', content_id: 9001, html_url: '/courses/103/files/9001' },
                { title: 'Essay 2 Draft', type: 'Assignment', content_id: 3002 },
            ],
        },
        { name: 'Week 5', items: [{ title: 'Reading Response 3', type: 'Assignment', content_id: 3012 }] },
    ],
    101: [{ name: 'Week 6: Trees', items: [{ title: 'Homework 6: Binary Trees', type: 'Assignment', content_id: 1003 }] }],
};

const SYLLABUS_PDF = textPdf([
    'ENGL 110 - Seminar in Composition - Fall 2026',
    'Instructor: Prof. Lin Chen   Office: Memorial Hall 027',
    'Office hours: Fridays 10:00-11:00 AM and by appointment.',
    '',
    'Grading: Essays 60%, Drafts & Peer Review 25%, Participation 15%.',
    '',
    'Late policy: Essays lose one letter grade per day late.',
    'Drafts must be on time for peer review; late drafts earn no credit.',
    'Each student may request ONE 48-hour extension per semester by email,',
    'at least 24 hours before the deadline.',
    '',
    'Attendance: more than 3 unexcused absences lowers the final grade by a third of a letter.',
]);

export const FILES: Record<number, { id: number; display_name: string; 'content-type': string; size: number; updated_at: string; url: string; bytes: Uint8Array; course: number }> = {
    9001: { id: 9001, display_name: 'ENGL110-Syllabus.pdf', 'content-type': 'application/pdf', size: SYLLABUS_PDF.length, updated_at: '2026-08-24T10:00:00Z', url: '/files/9001/download?verifier=preview', bytes: SYLLABUS_PDF, course: 103 },
};
