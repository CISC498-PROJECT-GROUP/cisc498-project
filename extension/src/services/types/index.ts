/* View-models the widget renders, mapped from Canvas API responses by services/canvas/*.
   Extension-only — nothing here crosses to the API. */

export type View = 'home' | 'chat' | 'grades' | 'deadlines' | 'support';

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
    submitted: boolean;
    missing: boolean;
}

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
}
