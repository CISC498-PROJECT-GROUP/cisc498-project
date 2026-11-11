// Stand-in Stellic: the invented student's degree audit, in the shape /planner/getauditinfo/ answers
// with — the requirement tree (for names) and audit_data per program (satisfied, the credit figures,
// cards_remaining). The figures add up against the plan in plan.ts: 29 credits earned in 2025–26,
// 14 in progress this fall, the rest planned. Never bundled.

const units = (taken: number, in_progress: number, planned: number, remaining: number) => ({ progress_data: { units_summary: { taken, in_progress, planned, remaining } } });

const cards = (...ids: [id: number, units: number][]) => ids.map(([requirement_id, u]) => ({ requirement_id, units: u }));

const REQ_TREE = {
    programs: [
        {
            id: 410,
            screen_name: 'Computer Science Major (CS-BS) (17F-current)',
            choices: [
                { id: 411, screen_name: 'Computer Science Core', choices: [] },
                { id: 412, screen_name: 'Technical Electives' },
                { id: 413, screen_name: 'Concentration: Artificial Intelligence and Robotics' },
                { id: 414, screen_name: 'Mathematics Requirement' },
                { id: 415, screen_name: 'Science Sequence' },
            ],
        },
        { id: 420, screen_name: 'Computer Science Major (CS-BS) Minimum Total Credits 2019F', choices: [{ id: 421, screen_name: 'Total Credits' }] },
        {
            id: 430,
            screen_name: 'University Requirements (17F-current)',
            choices: [
                { id: 431, screen_name: 'First Year Seminar' },
                { id: 432, screen_name: 'Seminar in Composition' },
                { id: 433, screen_name: 'Multicultural Requirement' },
            ],
        },
        {
            id: 440,
            screen_name: 'University Breadth Requirements (18F-current)',
            choices: [
                { id: 441, screen_name: 'Creative Arts and Humanities' },
                { id: 442, screen_name: 'History and Cultural Change' },
                { id: 443, screen_name: 'Social and Behavioral Sciences' },
                { id: 444, screen_name: 'Mathematics, Natural Sciences and Technology' },
            ],
        },
        { id: 450, screen_name: 'College of Engineering Requirements 2019F', choices: [{ id: 451, screen_name: 'Engineering Writing Requirement' }] },
    ],
};

const AUDIT_DATA = {
    '410': { satisfied: false, ...units(13, 11, 49, 9), cards_remaining: cards([412, 3], [412, 3], [413, 3]) },
    '420': { satisfied: false, ...units(29, 14, 65, 16), cards_remaining: cards([421, 16]) },
    '430': { satisfied: true, ...units(7, 3, 0, 0) },
    '440': { satisfied: false, ...units(15, 0, 6, 3), cards_remaining: cards([441, 3]) },
    '450': { satisfied: true, ...units(3, 0, 3, 0) },
};

/** POST /planner/getauditinfo/ */
export function auditInfo() {
    return {
        success: true,
        audit_data: AUDIT_DATA,
        req_tree: REQ_TREE,
        student_audit: { grades_summary: { c_gpa: 3.47 } },
        remaining_reqs_details: { pathway: { name: 'Artificial Intelligence and Robotics' } },
        last_computed: '2026-11-09T08:12:00Z',
    };
}
