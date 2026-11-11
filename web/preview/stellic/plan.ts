// Stand-in Stellic: the invented student's four-year plan, in the shape /planner/getstudentplan/
// answers with (see src/services/stellic/stellic-types.ts). Fall 2026 — the current term — holds the
// same four courses as the stand-in Canvas (preview/canvas/courses.ts), so Home's this-term join
// matches; Spring 2027 is planned with courses the stand-in WebReg catalog offers. Never bundled.

type Course = [code: string, name: string, units: number, grade?: string];

interface Term {
    season: 1 | 2 | 3 | 4;
    planYear: number;
    year: number;
    start: string;
    end: string;
    courses: Course[];
}

const TERMS: Term[] = [
    {
        season: 1,
        planYear: 1,
        year: 2025,
        start: '2025-08-26',
        end: '2025-12-18',
        courses: [
            ['CISC 108', 'Introduction to Computer Science I', 3, 'A'],
            ['MATH 241', 'Analytic Geometry and Calculus A', 4, 'B+'],
            ['PSYC 100', 'General Psychology', 3, 'A-'],
            ['HIST 104', 'World History II', 3, 'B+'],
            ['UNIV 101', 'First Year Seminar', 1, 'P'],
        ],
    },
    {
        season: 3,
        planYear: 1,
        year: 2026,
        start: '2026-02-09',
        end: '2026-05-28',
        courses: [
            ['CISC 181', 'Introduction to Computer Science II', 3, 'A-'],
            ['MATH 210', 'Discrete Mathematics I', 3, 'B+'],
            ['COMM 212', 'Oral Communication', 3, 'A'],
            ['ECON 101', 'Introduction to Microeconomics', 3, 'B'],
            ['PHIL 105', 'Critical Thinking', 3, 'A-'],
        ],
    },
    {
        season: 1,
        planYear: 2,
        year: 2026,
        start: '2026-08-25',
        end: '2026-12-17',
        courses: [
            ['CISC 220', 'Data Structures', 3],
            ['MATH 242', 'Analytic Geometry and Calculus B', 4],
            ['ENGL 110', 'Seminar in Composition', 3],
            ['PHYS 207', 'Fundamentals of Physics I', 4],
        ],
    },
    {
        season: 3,
        planYear: 2,
        year: 2027,
        start: '2027-02-08',
        end: '2027-05-27',
        courses: [
            ['CISC 210', 'Introduction to Systems Programming', 3],
            ['CISC 260', 'Machine Organization and Assembly Language', 3],
            ['MATH 243', 'Analytic Geometry and Calculus C', 4],
            ['PHYS 208', 'Fundamentals of Physics II', 4],
            ['ENGL 312', 'Written Communications in Business', 3],
        ],
    },
    {
        season: 1,
        planYear: 3,
        year: 2027,
        start: '2027-08-31',
        end: '2027-12-16',
        courses: [
            ['CISC 275', 'Introduction to Software Engineering', 3],
            ['CISC 303', 'Automata Theory', 3],
            ['CISC 361', 'Operating Systems', 3],
            ['MATH 350', 'Probability Theory and Simulation Methods', 3],
            ['ARTH 150', 'Monuments and Methods in the History of Art', 3],
        ],
    },
    {
        season: 3,
        planYear: 3,
        year: 2028,
        start: '2028-02-07',
        end: '2028-05-25',
        courses: [
            ['CISC 320', 'Introduction to Algorithms', 3],
            ['CISC 372', 'Parallel Computing', 3],
            ['CISC 437', 'Database Systems', 3],
            ['MATH 349', 'Elementary Linear Algebra', 3],
        ],
    },
    {
        season: 1,
        planYear: 4,
        year: 2028,
        start: '2028-08-29',
        end: '2028-12-14',
        courses: [
            ['CISC 475', 'Advanced Software Engineering', 3],
            ['CISC 481', 'Artificial Intelligence', 3],
            ['CISC 498', 'Computer Science Senior Design Project I', 3],
            ['MUSC 101', 'Appreciation of Music', 3],
        ],
    },
    {
        season: 3,
        planYear: 4,
        year: 2029,
        start: '2029-02-05',
        end: '2029-05-24',
        courses: [
            ['CISC 499', 'Computer Science Senior Design Project II', 3],
            ['CISC 450', 'Computer Networks I', 3],
            ['CISC 484', 'Introduction to Machine Learning', 3],
        ],
    },
];

const today = (): string => new Date().toISOString().slice(0, 10);

function rawCourse([code, name, units, grade]: Course, term: Term) {
    const current = term.start <= today() && today() <= term.end;
    const registered = grade !== undefined || current;
    return {
        code,
        name,
        units,
        grade: grade ?? '',
        is_registered: registered,
        is_credit_earned: grade !== undefined,
        status: grade ? 'taken' : current ? 'in_progress' : 'planned',
        registration_status: current ? { screen_name: 'Enrolled', type: 'enrolled' } : grade ? null : { screen_name: 'Planned', type: 'planned' },
    };
}

/** POST /planner/getstudentplan/ */
export function studentPlan() {
    const seasons = [1, 2, 3, 4].map((id) => ({
        id,
        content: Object.fromEntries(
            [1, 2, 3, 4].map((planYear) => {
                const term = TERMS.find((t) => t.season === id && t.planYear === planYear);
                const content = term ? { physical_year: term.year, is_past: term.end < today(), semester_dates: { start_date: term.start, end_date: term.end }, courses: term.courses.map((c) => rawCourse(c, term)) } : { courses: [] };
                return [String(planYear), content];
            }),
        ),
    }));
    return { success: true, student_plan: { plan_id: 'standin-plan-1', name: 'My Plan', programs: [{ id: 410, name: 'Computer Science (BS)', short_name: 'CS-BS' }], sem_content: seasons } };
}
