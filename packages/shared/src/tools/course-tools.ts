// Tools about courses, work and grades.

const courseId = { type: 'string', description: 'Canvas course id, from list_courses or the course list in context.' };

export const COURSE_TOOLS = [
    {
        name: 'list_courses',
        description: "The student's active courses: id, code, name, term, instructors, and current overall score and letter grade where Canvas shows one.",
        input_schema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
        name: 'get_upcoming_work',
        description:
            'Everything with a date across ALL courses — assignments, quizzes, discussions, calendar events — from the student planner, with submitted / missing / graded flags. Use for "what\'s due this week", "what am I missing", "what did I miss". Dates are in the student\'s local time.',
        input_schema: {
            type: 'object',
            properties: {
                days_ahead: { type: 'integer', description: 'How many days forward to include. Default 14, max 120.' },
                days_back: { type: 'integer', description: 'How many days back to include, to find missing or recent work. Default 0, max 120.' },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'list_assignments',
        description: 'Every assignment in one course: id, name, due date, points, assignment group, and the student\'s submission status and score. Descriptions are omitted — use get_assignment for one assignment\'s full instructions.',
        input_schema: { type: 'object', properties: { course_id: courseId }, required: ['course_id'], additionalProperties: false },
    },
    {
        name: 'get_assignment',
        description: "One assignment in full: instructions, due / available-from / until dates, points, submission types, allowed attempts, rubric, and the student's submission, score and late/missing status.",
        input_schema: {
            type: 'object',
            properties: { course_id: courseId, assignment_id: { type: 'string', description: 'Assignment id from list_assignments or get_upcoming_work.' } },
            required: ['course_id', 'assignment_id'],
            additionalProperties: false,
        },
    },
    {
        name: 'get_grade_breakdown',
        description:
            "The course's grading scheme and the student's standing in it: each assignment group with its weight (if the course weights groups), every assignment in it with score and points possible, the group's current percent, and the overall current score. Use for grade questions and for \"what do I need on the final\" math.",
        input_schema: { type: 'object', properties: { course_id: courseId }, required: ['course_id'], additionalProperties: false },
    },
    {
        name: 'list_announcements',
        description: 'Recent announcements, newest first, with their full text. Omit course_id for all courses.',
        input_schema: {
            type: 'object',
            properties: { course_id: courseId, days_back: { type: 'integer', description: 'How far back to look. Default 30, max 180.' } },
            additionalProperties: false,
        },
    },
] as const;
