// Tools for a course's RECORDED LECTURES — the recordings in its Media Gallery. Summaries and study
// PDFs are built from the lectures' own captions, and a lecture's date is its recording's date, so
// everything these tools return traces back to what was said in class.
//
// The tools that read a range take `range_basis`: where the dates came from, in the student's words or
// the exam's evidence. Having to fill it is what makes the model ask for a time frame instead of
// quietly assuming "all lectures" — a range with no basis is not one to build from.

const courseId = { type: 'string', description: 'Canvas course id, from list_courses or the course list in context.' };

const day = (what: string) => ({ type: 'string', description: `${what}, as YYYY-MM-DD in the student's time zone.` });

const rangeBasis = {
    type: 'string',
    description:
        'Where the dates came from: the student\'s own words that set the time frame, quoted ("this week", "since Oct 1", "everything so far"), or the exam it is for and the Canvas evidence for its range ("Midterm 1: the syllabus says it covers weeks 1–6"). If the student named no time frame and no exam, do not call this tool — ask them first.',
};

export const LECTURE_TOOLS = [
    {
        name: 'list_lectures',
        description:
            "The recorded lectures in a course's Media Gallery, oldest first: title, recording date and length. Use it to see what was covered when — a recording titled like \"Midterm Review\" marks the end of an exam's material — and to check which dates have recordings before summarizing or building a study PDF.",
        input_schema: { type: 'object', properties: { course_id: courseId }, required: ['course_id'], additionalProperties: false },
    },
    {
        name: 'summarize_lectures',
        description:
            "Summaries of the recorded lectures in a date range, built from their captions: each lecture's main points and topics, definitions, worked examples, mistakes the instructor warned about, and anything said about exams (with verbatim quotes). Needs a time frame from the student or an exam — never assume all lectures. At most 20 lectures per call.",
        input_schema: {
            type: 'object',
            properties: { course_id: courseId, from: day('First day to include'), to: day('Last day to include'), range_basis: rangeBasis },
            required: ['course_id', 'from', 'to', 'range_basis'],
            additionalProperties: false,
        },
    },
    {
        name: 'create_study_pdf',
        description:
            "Build a PDF from the recorded lectures in a date range and attach it to your reply as a download. kind \"topics\" is a short outline of the topics covered, lecture by lecture; \"study_guide\" is a full illustrated study guide — an exam-at-a-glance page, every topic explained with worked examples and the instructor's own words, and a one-page review sheet. Needs a time frame from the student, or an exam whose range you work out — never assume all lectures. Takes a few minutes.",
        input_schema: {
            type: 'object',
            properties: {
                course_id: courseId,
                kind: { type: 'string', enum: ['topics', 'study_guide'], description: '"topics" for a list or outline of topics; "study_guide" for a study guide, review sheet or exam guide.' },
                from: day('First day of lectures to include'),
                to: day('Last day of lectures to include'),
                range_basis: rangeBasis,
                title: { type: 'string', description: 'A short title for the cover, e.g. "Midterm Study Guide" or "Weeks 3–5 Topics".' },
                exam_name: { type: 'string', description: 'The exam this is for, e.g. "Midterm 1", or "" if none.' },
                exam_date: { type: 'string', description: 'When and where the exam is, as Canvas states it, e.g. "Mon, Oct 19 · in class", or "" if unknown.' },
                exam_notes: {
                    type: 'string',
                    description: 'What Canvas (syllabus, announcements, pages) says about the exam — scope, format, allowed materials, topics excluded — quoted or closely paraphrased from tool results, or "" if nothing.',
                },
            },
            required: ['course_id', 'kind', 'from', 'to', 'range_basis', 'title', 'exam_name', 'exam_date', 'exam_notes'],
            additionalProperties: false,
        },
    },
] as const;
