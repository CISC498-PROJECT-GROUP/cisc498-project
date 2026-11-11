// Stand-in Stellic: who the invented student is (standing, school, expected graduation, advisors)
// and where their plan review stands, in the shapes /planner/getstudentprofile/ and
// /planner/plan-review-summary/ answer with. The name matches the stand-in Canvas user. Never bundled.

export const USERNAME = 'arivera';

const ADVISOR = { first_name: 'Dana', last_name: 'Whitfield', email: 'dwhitfield@example.edu' };

/** POST /planner/getstudentprofile/ */
export function studentProfile() {
    return {
        success: true,
        username: USERNAME,
        first_name: 'Alex',
        last_name: 'Rivera',
        level_name: 'Sophomore',
        school: 'College of Engineering',
        expected_graduation_usem: { semester: 3, year: 2029 },
        primary_advisor: ADVISOR,
        secondary_advisors: [{ first_name: 'Priya', last_name: 'Natarajan', email: 'pnatarajan@example.edu' }],
    };
}

/** GET /planner/plan-review-summary/?student_username=… */
export function reviewSummary() {
    return { success: true, data: { is_plan_reviewed: false, open_review_details: { reviewer: ADVISOR, review_initiated_at: '2026-10-28T14:05:00Z' }, last_reviewed_details: null } };
}
