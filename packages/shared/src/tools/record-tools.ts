// Tools over the student's academic record beyond Canvas: their degree plan and audit (Stellic) and
// their registration (WebReg). All three read only — the assistant never registers, drops or edits;
// the student does that themselves on the site's Schedule page, after confirming each change.

const term = { type: 'string', description: 'WebReg term code (e.g. "2273") or name (e.g. "Spring 2027"). Omit for the upcoming term WebReg opens by default.' };

export const RECORD_TOOLS = [
    {
        name: 'get_degree_plan',
        description:
            'The student\'s degree plan and audit from Stellic: programs (majors, minors), class standing, school, expected graduation term, cumulative GPA, credits earned / in progress / planned / remaining per program and the requirements still open, every term\'s courses with grade and status (completed, enrolled, planned), advisors and plan-review status. Use for degree progress, "what do I still need", "am I on track to graduate", and "what did I plan for next semester".',
        input_schema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
        name: 'get_registration',
        description:
            'The student\'s registered classes in WebReg for one term: each section with its meeting days, times and location, instructor, credits and grading, plus the term\'s registration windows (open enrollment, add/drop deadline), total credits and the credit limit, and the terms WebReg offers. Use for "what am I registered for", "when are my classes next semester", and registration dates.',
        input_schema: { type: 'object', properties: { term }, additionalProperties: false },
    },
    {
        name: 'search_classes',
        description:
            'Search WebReg for a term\'s offerings. A subject or partial number ("CISC", "MATH 24") lists matching courses; a whole course ("CISC 220") lists its sections with meeting times, instructor, credits, open/full and waitlist, and required labs. Use when the student is planning a schedule or asks when a class is offered. Reading only — the student registers on the site\'s Schedule page.',
        input_schema: { type: 'object', properties: { query: { type: 'string', description: 'Subject, partial course, or whole course code, e.g. "CISC", "CISC 2", "CISC 220".' }, term }, required: ['query'], additionalProperties: false },
    },
] as const;
