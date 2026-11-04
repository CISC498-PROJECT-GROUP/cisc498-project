/* The subset of Stellic's response fields the dashboard reads, as observed from UD's deployment.
   Stellic has no published schema, so every field is treated as possibly absent and every mapper
   tolerates its absence. */

export interface RawPlanCourse {
    code?: string;
    name?: string;
    units?: number | null;
    grade?: string | null;
    is_registered?: boolean | null;
    is_credit_earned?: boolean | null;
    status?: string | null;
    registration_status?: { screen_name?: string | null; type?: string | null } | null;
    not_counted?: boolean;
}

export interface RawSemesterContent {
    courses?: RawPlanCourse[];
    physical_year?: number;
    is_past?: boolean;
    semester_dates?: { start_date?: string | null; end_date?: string | null } | null;
}

/** sem_content is keyed by season (`id`: 1 fall … 4 summer), then by plan year ("1".."4"). */
export interface RawSemContent {
    id: number;
    content?: Record<string, RawSemesterContent>;
}

export interface RawStudentPlan {
    student_plan?: {
        plan_id?: string;
        name?: string;
        programs?: { id?: number; name?: string; short_name?: string }[];
        sem_content?: RawSemContent[];
    };
}

export interface RawUnits {
    taken?: number;
    in_progress?: number;
    remaining?: number;
}

export interface RawAuditNode {
    satisfied?: boolean;
    num_remaining?: number;
    cards_remaining?: { requirement_id?: number; units?: number }[];
    progress_data?: { units_summary?: RawUnits };
}

/** A requirement in the tree: a program at the top, then groups, down to single courses. */
export interface RawReq {
    id?: number;
    screen_name?: string;
    choices?: (RawReq | unknown)[];
}

export interface RawAudit {
    audit_data?: Record<string, RawAuditNode>;
    req_tree?: { programs?: RawReq[] };
    student_audit?: { grades_summary?: { c_gpa?: number | null } };
    remaining_reqs_details?: { pathway?: { name?: string } | null };
    last_computed?: string;
}

export interface RawPerson {
    first_name?: string;
    last_name?: string;
    email?: string | null;
}

export interface RawProfile {
    first_name?: string;
    last_name?: string;
    level_name?: string | null;
    school?: string | null;
    expected_graduation_usem?: { semester?: number; year?: number } | null;
    primary_advisor?: RawPerson | null;
    secondary_advisors?: RawPerson[];
}

export interface RawReviewSummary {
    data?: {
        is_plan_reviewed?: boolean;
        open_review_details?: { reviewer?: RawPerson | null; review_initiated_at?: string | null } | null;
        last_reviewed_details?: { reviewed_at?: string | null } | null;
    };
}
