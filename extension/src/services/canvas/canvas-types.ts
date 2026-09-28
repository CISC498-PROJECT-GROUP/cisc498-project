/* The subset of Canvas API response fields this extension reads. Canvas returns far more; only what
   is used is declared, and every field is treated as possibly absent. */

export interface RawEnrollment {
    type?: string;
    computed_current_score?: number | null;
    computed_current_grade?: string | null;
}

export interface RawCourse {
    id: number | string;
    name?: string;
    course_code?: string;
    access_restricted_by_date?: boolean;
    term?: { name?: string } | null;
    teachers?: { id: number | string; display_name?: string }[];
    enrollments?: RawEnrollment[];
    apply_assignment_group_weights?: boolean;
    hide_final_grades?: boolean;
    syllabus_body?: string | null;
}

export interface RawSubmission {
    score?: number | null;
    grade?: string | null;
    excused?: boolean;
    missing?: boolean;
    late?: boolean;
    workflow_state?: string;
    submitted_at?: string | null;
    attempt?: number | null;
}

export interface RawAssignment {
    id: number | string;
    name?: string;
    description?: string | null;
    due_at?: string | null;
    unlock_at?: string | null;
    lock_at?: string | null;
    points_possible?: number | null;
    omit_from_final_grade?: boolean;
    submission_types?: string[];
    allowed_attempts?: number;
    assignment_group_id?: number | string;
    html_url?: string;
    rubric?: { description?: string; points?: number; ratings?: { description?: string; points?: number }[] }[];
    submission?: RawSubmission;
}

export interface RawAssignmentGroup {
    id: number | string;
    name?: string;
    group_weight?: number;
    assignments?: RawAssignment[];
}

export interface RawPlannerItem {
    course_id?: number | string;
    context_name?: string;
    plannable_id: number | string;
    plannable_type?: string;
    plannable_date?: string;
    html_url?: string;
    plannable?: { title?: string; due_at?: string | null; todo_date?: string | null; points_possible?: number | null };
    submissions?: false | { submitted?: boolean; missing?: boolean; graded?: boolean; late?: boolean; excused?: boolean };
}
