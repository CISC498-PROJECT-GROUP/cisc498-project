// Preview fixtures: assignments, grades, planner and announcements, with dates relative to today.

const at = (days: number, h = 23, m = 59) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
};

type Sub = { score?: number | null; missing?: boolean; submitted_at?: string | null; late?: boolean };
const a = (id: number, name: string, points: number, due: number, sub: Sub = {}, desc = '') => ({ id, name, points_possible: points, due_at: at(due), description: desc, submission: { score: null, ...sub }, html_url: `/courses/x/assignments/${id}` });
const graded = (id: number, name: string, points: number, due: number, score: number) => a(id, name, points, due, { score, submitted_at: at(due - 1) });

export const GROUPS: Record<number, { id: number; name: string; group_weight: number; assignments: ReturnType<typeof a>[] }[]> = {
    101: [
        {
            id: 1,
            name: 'Homework',
            group_weight: 40,
            assignments: [
                graded(1001, 'Homework 4: Linked Lists', 20, -12, 19),
                graded(1002, 'Homework 5: Stacks & Queues', 20, -5, 17),
                a(1003, 'Homework 6: Binary Trees', 20, 1, {}, '<p>Implement insert, delete and in-order traversal for a BST. Submit <code>bst.py</code> to Gradescope. Tests are in the starter repo.</p>'),
            ],
        },
        { id: 2, name: 'Quizzes', group_weight: 20, assignments: [graded(1011, 'Quiz 3', 10, -8, 8), a(1012, 'Quiz 4', 10, 6)] },
        { id: 3, name: 'Midterm', group_weight: 15, assignments: [graded(1021, 'Midterm Exam', 100, -2, 81)] },
        { id: 4, name: 'Final Project', group_weight: 25, assignments: [a(1031, 'Final Project Proposal', 25, 8, {}, '<p>One page: the problem, the data structure you will build, and a timeline.</p>'), a(1032, 'Final Project', 100, 60)] },
    ],
    102: [
        { id: 5, name: 'Problem Sets', group_weight: 30, assignments: [graded(2001, 'Problem Set 4', 30, -6, 28), a(2002, 'Problem Set 5', 30, 2)] },
        { id: 6, name: 'Exams', group_weight: 50, assignments: [graded(2011, 'Exam 1', 100, -10, 89), a(2012, 'Exam 2', 100, 17), a(2013, 'Final Exam', 150, 76)] },
        { id: 7, name: 'Participation', group_weight: 20, assignments: [graded(2021, 'Participation', 20, -1, 18.6)] },
    ],
    103: [
        { id: 8, name: 'Essays', group_weight: 60, assignments: [graded(3001, 'Essay 1', 100, -14, 95), a(3002, 'Essay 2 Draft', 20, 4, {}, '<p>Bring two printed copies for peer review.</p>')] },
        { id: 9, name: 'Drafts & Peer Review', group_weight: 25, assignments: [graded(3011, 'Peer Review 1', 10, -9, 9), a(3012, 'Reading Response 3', 10, -2, { missing: true })] },
        { id: 10, name: 'Participation', group_weight: 15, assignments: [graded(3021, 'Participation', 15, -1, 14)] },
    ],
    104: [
        { id: 11, name: 'Labs', group_weight: 0, assignments: [graded(4001, 'Lab 3 Report', 15, -7, 13), a(4002, 'Lab 4 Report', 15, 6)] },
        { id: 12, name: 'Homework', group_weight: 0, assignments: [graded(4011, 'Homework 5', 20, -4, 16), a(4012, 'Homework 6', 20, 3)] },
        { id: 13, name: 'Exams', group_weight: 0, assignments: [graded(4021, 'Exam 1', 100, -11, 79)] },
    ],
};

export const assignmentsOf = (course: number) => (GROUPS[course] ?? []).flatMap((g) => g.assignments.map((x) => ({ ...x, assignment_group_id: g.id, html_url: `/courses/${course}/assignments/${x.id}` })));

export function planner(start: Date, end: Date) {
    return Object.keys(GROUPS).flatMap((cid) =>
        assignmentsOf(Number(cid))
            .filter((x) => new Date(x.due_at) >= start && new Date(x.due_at) <= end)
            .map((x) => ({
                course_id: Number(cid),
                context_name: { 101: 'Data Structures', 102: 'Calculus II', 103: 'Seminar in Composition', 104: 'Physics I' }[Number(cid)],
                plannable_id: x.id,
                plannable_type: 'assignment',
                html_url: x.html_url,
                plannable: { title: x.name, due_at: x.due_at, points_possible: x.points_possible },
                submissions: { submitted: x.submission.submitted_at != null, missing: x.submission.missing === true, graded: x.submission.score != null },
            })),
    );
}

export const ANNOUNCEMENTS = [
    {
        title: 'Lab 4 moved to Thursday',
        message: '<p>Because of the building maintenance, Lab 4 meets <strong>Thursday</strong> this week instead of Wednesday. The report due date does not change.</p>',
        posted_at: at(-2, 9, 0),
        context_code: 'course_104',
        html_url: '/courses/104/discussion_topics/1',
        author: { display_name: 'Dr. Maria Reyes' },
    },
    {
        title: 'Midterm grades posted',
        message: '<p>Midterm grades are up. The average was 76. Regrade requests close in one week.</p>',
        posted_at: at(-1, 16, 0),
        context_code: 'course_101',
        html_url: '/courses/101/discussion_topics/2',
        author: { display_name: 'Dr. Anita Patel' },
    },
];
