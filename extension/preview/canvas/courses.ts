// Preview fixtures: four invented courses. Lives only in the preview harness — never bundled.

export const USER = { id: 1, name: 'Alex Rivera', short_name: 'Alex Rivera' };

const enroll = (score: number | null, grade: string | null) => [{ type: 'student', computed_current_score: score, computed_current_grade: grade }];

export const COURSES = [
    { id: 101, name: 'Data Structures', course_code: 'CISC 220', term: { name: 'Fall 2026' }, teachers: [{ id: 11, display_name: 'Dr. Anita Patel' }], enrollments: enroll(88.1, 'B+'), apply_assignment_group_weights: true },
    { id: 102, name: 'Calculus II', course_code: 'MATH 242', term: { name: 'Fall 2026' }, teachers: [{ id: 12, display_name: 'Dr. Ray Okafor' }], enrollments: enroll(91.3, 'A-'), apply_assignment_group_weights: true },
    { id: 103, name: 'Seminar in Composition', course_code: 'ENGL 110', term: { name: 'Fall 2026' }, teachers: [{ id: 13, display_name: 'Prof. Lin Chen' }], enrollments: enroll(94, 'A'), apply_assignment_group_weights: true },
    { id: 104, name: 'Physics I', course_code: 'PHYS 207', term: { name: 'Fall 2026' }, teachers: [{ id: 14, display_name: 'Dr. Maria Reyes' }], enrollments: enroll(82.5, 'B-'), apply_assignment_group_weights: false },
];

export const COLORS = { custom_colors: { course_101: '#3b6e8f', course_102: '#7a4e9a', course_103: '#b5542d', course_104: '#2e7d5b' } };

export const SYLLABI: Record<number, string> = {
    101: `<h2>CISC 220 — Data Structures</h2><p><strong>Instructor:</strong> Dr. Anita Patel, apatel@example.edu</p>
<p><strong>Office hours:</strong> Tuesdays and Thursdays 2:00–3:30 PM, Smith Hall 204, or by appointment.</p>
<h3>Grading</h3><table><tr><td>Homework</td><td>40%</td></tr><tr><td>Quizzes</td><td>20%</td></tr><tr><td>Midterm</td><td>15%</td></tr><tr><td>Final Project</td><td>25%</td></tr></table>
<h3>Late work</h3><p>Homework loses 10% per day late, up to 3 days; after that it receives a zero. You get two free "grace days" per semester — email the TA to use one.</p>
<p>The midterm was held in class the week of <strong>September 21</strong>. The final project is due <strong>December 10</strong>.</p>`,
    102: '',
    103: '',
    104: `<h2>PHYS 207 — Physics I</h2><p>Office hours: Wednesdays 3:00–4:30 PM, Sharp Lab 118.</p>
<p>Grades are total points. Labs must be completed to pass the course; a missed lab can be made up only with a documented excuse within one week.</p>
<p>Late homework is not accepted, but your lowest homework score is dropped.</p>`,
};
