// Executors for the course / work / grade tools. Each returns what the model needs to answer, with
// times already in the student's local zone (localStamp) and HTML already reduced to text.

import { absoluteUrl, canvasGet, canvasGetAll } from '@/services/canvas/canvas-api';
import type { RawAssignment } from '@/services/canvas/canvas-types';
import { loadCourses } from '@/services/canvas/courses';
import { fetchAssignmentGroups, summariseGroups } from '@/services/canvas/grades';
import { htmlToText } from '@/services/canvas/html-text';
import { fetchPlanner } from '@/services/canvas/planner';
import { localStamp } from '@/services/format/dates';
import { clip, intIn, need, optional, toJson, type ToolInput } from '@/services/tools/tool-helpers';

const status = (a: RawAssignment) => {
    const s = a.submission;
    if (!s) return undefined;
    if (s.excused) return 'excused';
    if (s.missing) return 'missing';
    if (typeof s.score === 'number') return `graded ${s.score}/${a.points_possible ?? '?'}${s.late ? ' (late)' : ''}`;
    if (s.submitted_at) return `submitted ${localStamp(s.submitted_at)}${s.late ? ' (late)' : ''}`;
    return 'not submitted';
};

export async function listCourses(): Promise<string> {
    const courses = await loadCourses();
    return toJson(courses.map((c) => ({ id: c.id, code: c.code, name: c.name, term: c.term, instructors: c.teachers.map((t) => t.name), current_score: c.percent, current_grade: c.letter, url: c.url })));
}

export async function upcomingWork(input: ToolInput): Promise<string> {
    const items = await fetchPlanner(intIn(input, 'days_ahead', 14, 120), intIn(input, 'days_back', 0, 120));
    if (items.length === 0) return 'Nothing in the planner for that window.';
    return toJson(
        items.map((d) => ({
            course: d.courseName,
            course_id: d.courseId,
            type: d.kind,
            title: d.title,
            id: d.id.replace(/^\w+-/, ''),
            due: localStamp(d.dueAt.toISOString()),
            points: d.points,
            submitted: d.submitted,
            missing: d.missing || undefined,
            url: d.url,
        })),
    );
}

export async function listAssignments(input: ToolInput): Promise<string> {
    const course = need(input, 'course_id');
    const assignments = await canvasGetAll<RawAssignment>(`/courses/${course}/assignments`, { 'include[]': ['submission'], order_by: 'due_at' });
    return toJson(assignments.map((a) => ({ id: String(a.id), name: a.name, due: localStamp(a.due_at), points: a.points_possible, group_id: a.assignment_group_id, status: status(a) })));
}

export async function getAssignment(input: ToolInput): Promise<string> {
    const a = await canvasGet<RawAssignment>(`/courses/${need(input, 'course_id')}/assignments/${need(input, 'assignment_id')}`, { 'include[]': ['submission'] });
    return clip(
        toJson({
            name: a.name,
            due: localStamp(a.due_at),
            available_from: localStamp(a.unlock_at),
            available_until: localStamp(a.lock_at),
            points: a.points_possible,
            submission_types: a.submission_types,
            allowed_attempts: a.allowed_attempts === -1 ? 'unlimited' : a.allowed_attempts,
            status: status(a),
            url: absoluteUrl(a.html_url),
            rubric: a.rubric?.map((r) => ({ criterion: r.description, points: r.points, ratings: r.ratings?.map((x) => `${x.points}: ${x.description}`) })),
        }) +
            '\n\nInstructions:\n' +
            (htmlToText(a.description) || '(none)'),
    );
}

export async function gradeBreakdown(input: ToolInput): Promise<string> {
    const courseId = need(input, 'course_id');
    const [groups, courses] = await Promise.all([fetchAssignmentGroups(courseId), loadCourses()]);
    const course = courses.find((c) => c.id === courseId);
    const weighted = groups.some((g) => (g.group_weight ?? 0) > 0);
    const summaries = summariseGroups(groups, weighted);
    return toJson({
        course: course?.code,
        current_score: course?.percent,
        current_grade: course?.letter,
        weighting: weighted ? 'assignment groups are weighted — weight is the percent of the final grade' : 'not weighted — the grade is total points earned over points possible',
        groups: groups.map((g, i) => ({
            name: g.name,
            weight: summaries[i]!.weight,
            current_percent: summaries[i]!.percent,
            assignments: (g.assignments ?? []).map((a) => ({ name: a.name, points_possible: a.points_possible, due: localStamp(a.due_at), status: status(a), counts_toward_grade: a.omit_from_final_grade ? false : undefined })),
        })),
    });
}

export async function listAnnouncements(input: ToolInput): Promise<string> {
    const courseId = optional(input, 'course_id') ?? (typeof input.course_id === 'number' ? String(input.course_id) : undefined);
    const codes = courseId ? [`course_${courseId}`] : (await loadCourses()).map((c) => `course_${c.id}`);
    if (codes.length === 0) return 'No courses to read announcements from.';
    const days = intIn(input, 'days_back', 30, 180);
    const items = await canvasGetAll<{ title?: string; message?: string; posted_at?: string; context_code?: string; html_url?: string; author?: { display_name?: string } }>(
        '/announcements',
        { 'context_codes[]': codes, start_date: new Date(Date.now() - days * 864e5).toISOString(), end_date: new Date().toISOString() },
        3,
    );
    if (items.length === 0) return `No announcements in the last ${days} days.`;
    return clip(items.map((a) => `## ${a.title} — ${a.context_code?.replace('course_', 'course ')} — ${localStamp(a.posted_at)} by ${a.author?.display_name ?? 'instructor'}\n${absoluteUrl(a.html_url)}\n${htmlToText(a.message)}`).join('\n\n'));
}
