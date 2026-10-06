/* View-models the widget renders, mapped from Canvas API responses by services/canvas/*.
   Extension-only — nothing here crosses to the API. */

export type View = 'home' | 'chat' | 'grades' | 'deadlines' | 'support' | 'submit';

export interface Teacher {
    id: string;
    name: string;
    /** The instructor's profile in this course. */
    url: string;
}

export interface Course {
    id: string;
    code: string;
    name: string;
    color: string;
    term: string | null;
    teachers: Teacher[];
    /** Current score, or null when the course hides it or nothing is graded yet. */
    percent: number | null;
    letter: string | null;
    url: string;
}

export interface GradeGroup {
    id: string;
    name: string;
    /** Percent of the final grade, or null when the course does not weight groups. */
    weight: number | null;
    /** The student's percent across the graded work in this group, or null if none is graded. */
    percent: number | null;
    graded: number;
    total: number;
}

export interface Deadline {
    id: string;
    courseId: string | null;
    courseName: string | null;
    title: string;
    dueAt: Date;
    points: number | null;
    url: string | null;
    kind: string;
    /** Set for assignments — the planner item's id — so the row can offer to submit it. */
    assignmentId: string | null;
    submitted: boolean;
    missing: boolean;
}

/** The submission types the widget can send itself. Anything else (quizzes, external tools, media,
    paper) is submitted in Canvas. */
export type SubmitKind = 'online_text_entry' | 'online_url' | 'online_upload';

/** What the submit view needs to know about one assignment before the student turns it in. */
export interface SubmitTarget {
    courseId: string;
    assignmentId: string;
    name: string;
    dueAt: Date | null;
    points: number | null;
    kinds: SubmitKind[];
    /** True when the assignment takes a submission, but only in a way the widget can't send. */
    canvasOnly: boolean;
    /** File extensions the upload must have, lower-case and without the dot; empty means any. */
    extensions: string[];
    /** Why Canvas won't take a submission right now (locked, or out of attempts), or null. */
    blocked: string | null;
    submittedAt: Date | null;
    url: string | null;
}

export type SubmissionInput = { kind: 'online_text_entry'; text: string } | { kind: 'online_url'; url: string } | { kind: 'online_upload'; files: File[] };

export interface ChatMessage {
    id: string;
    /** `error` is shown in the thread but is not part of the conversation sent to the model. */
    role: 'user' | 'assistant' | 'error';
    text: string;
}

/** What every data hook returns. */
export interface Loadable<T> {
    data: T;
    loading: boolean;
    error: string | null;
    /** Run the loader again — offered on the error state. */
    retry: () => void;
}
