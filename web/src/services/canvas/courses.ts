// The student's courses and who they are. Loaded once per page and shared: the dashboard views,
// the chat context and the list_courses tool all read the same promise.

import { absoluteUrl, canvasGet, canvasGetAll } from '@/services/canvas/canvas-api';
import type { RawCourse } from '@/services/canvas/canvas-types';
import type { Course } from '@/services/types';

/** Used when the student has not picked a colour for a course in Canvas. */
const PALETTE = ['#3b6e8f', '#7a4e9a', '#b5542d', '#2e7d5b', '#8c2f39', '#476a1f', '#0b6a8a', '#8a5a0a'];

export interface Student {
    name: string;
    shortName: string;
}

export const COURSE_PARAMS = { enrollment_state: 'active', 'include[]': ['total_scores', 'teachers', 'term'] } as const;

export const mapCourse = (raw: RawCourse, color: string): Course => {
    const id = String(raw.id);
    const enrollment = raw.enrollments?.find((e) => e.type === 'student') ?? raw.enrollments?.[0];
    const hidden = raw.hide_final_grades === true;
    return {
        id,
        code: raw.course_code ?? raw.name ?? `Course ${id}`,
        name: raw.name ?? raw.course_code ?? `Course ${id}`,
        color,
        term: raw.term?.name ?? null,
        teachers: (raw.teachers ?? []).map((t) => ({ id: String(t.id), name: t.display_name ?? 'Instructor', url: absoluteUrl(`/courses/${id}/users/${t.id}`)! })),
        percent: hidden ? null : (enrollment?.computed_current_score ?? null),
        letter: hidden ? null : (enrollment?.computed_current_grade ?? null),
        url: absoluteUrl(`/courses/${id}`)!,
    };
};

async function fetchCourses(): Promise<Course[]> {
    const [raw, colors] = await Promise.all([canvasGetAll<RawCourse>('/courses', COURSE_PARAMS), canvasGet<{ custom_colors?: Record<string, string> }>('/users/self/colors').catch(() => ({ custom_colors: {} as Record<string, string> }))]);
    return raw.filter((c) => !c.access_restricted_by_date && c.name).map((c, i) => mapCourse(c, colors.custom_colors?.[`course_${c.id}`] ?? PALETTE[i % PALETTE.length]!));
}

let courses: Promise<Course[]> | null = null;
let student: Promise<Student> | null = null;

/** Memoised for the page's lifetime; a failure is not cached, so the next caller retries. */
export function loadCourses(): Promise<Course[]> {
    courses ??= fetchCourses().catch((error) => {
        courses = null;
        throw error;
    });
    return courses;
}

export function loadStudent(): Promise<Student> {
    student ??= canvasGet<{ name?: string; short_name?: string }>('/users/self')
        .then((u) => ({ name: u.name ?? 'Student', shortName: u.short_name ?? u.name ?? 'there' }))
        .catch((error) => {
            student = null;
            throw error;
        });
    return student;
}
