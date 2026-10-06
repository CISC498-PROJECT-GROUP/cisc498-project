// Turning in an assignment: what Canvas will accept for it, checking the student's input against
// that before anything is sent, and the submission itself. Canvas stays the judge — it re-checks
// everything and its refusal is shown word for word — the checks here only catch the obvious
// before an upload is wasted.

import { absoluteUrl, canvasGet } from '@/services/canvas/canvas-api';
import type { RawAssignment, RawSubmission } from '@/services/canvas/canvas-types';
import { canvasPost, uploadFile } from '@/services/canvas/canvas-write';
import type { SubmissionInput, SubmitKind, SubmitTarget } from '@/services/types';

const SENDABLE: readonly SubmitKind[] = ['online_text_entry', 'online_url', 'online_upload'];

/** Types that mean there is nothing to turn in online at all. */
const OFFLINE = new Set(['none', 'on_paper', 'not_graded']);

export function mapSubmitTarget(courseId: string, raw: RawAssignment): SubmitTarget {
    const types = raw.submission_types ?? [];
    const kinds = SENDABLE.filter((k) => types.includes(k));
    const used = raw.submission?.attempt ?? 0;
    const allowed = raw.allowed_attempts ?? -1;
    let blocked: string | null = null;
    if (raw.locked_for_user) blocked = raw.lock_explanation?.replace(/<[^>]+>/g, '').trim() || 'This assignment is locked.';
    else if (allowed > 0 && used >= allowed) blocked = `You've used all ${allowed} attempt${allowed === 1 ? '' : 's'} for this assignment.`;
    return {
        courseId,
        assignmentId: String(raw.id),
        name: raw.name ?? 'Untitled assignment',
        dueAt: raw.due_at ? new Date(raw.due_at) : null,
        points: raw.points_possible ?? null,
        kinds,
        canvasOnly: kinds.length === 0 && types.some((t) => !OFFLINE.has(t)),
        extensions: (raw.allowed_extensions ?? []).map((e) => e.toLowerCase().replace(/^\./, '')),
        blocked,
        submittedAt: raw.submission?.submitted_at ? new Date(raw.submission.submitted_at) : null,
        url: absoluteUrl(raw.html_url),
    };
}

export async function fetchSubmitTarget(courseId: string, assignmentId: string): Promise<SubmitTarget> {
    const raw = await canvasGet<RawAssignment>(`/courses/${courseId}/assignments/${assignmentId}`, { 'include[]': ['submission'] });
    return mapSubmitTarget(courseId, raw);
}

const extensionOf = (name: string): string => (name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '');

/** Why this input can't be sent, in words for the student — or null when it can. */
export function checkSubmission(target: SubmitTarget, input: SubmissionInput): string | null {
    if (input.kind === 'online_text_entry') return input.text.trim() === '' ? 'Write something to submit first.' : null;
    if (input.kind === 'online_url') {
        try {
            const url = new URL(input.url.trim());
            return url.protocol === 'http:' || url.protocol === 'https:' ? null : 'The link must start with http:// or https://.';
        } catch {
            return 'That doesn’t look like a full link — include the https:// part.';
        }
    }
    if (input.files.length === 0) return 'Choose a file to upload first.';
    if (target.extensions.length === 0) return null;
    const wrong = input.files.find((f) => !target.extensions.includes(extensionOf(f.name)));
    return wrong ? `${wrong.name} isn't an accepted file type. This assignment takes: ${target.extensions.map((e) => `.${e}`).join(', ')}.` : null;
}

const escapeHtml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Plain text as the HTML Canvas expects for a text entry: blank lines split paragraphs, single
    newlines become line breaks, and nothing the student typed is read as markup. */
export const textToHtml = (text: string): string =>
    text
        .trim()
        .split(/\n\s*\n/)
        .map((para) => `<p>${escapeHtml(para.trim()).replace(/\n/g, '<br>')}</p>`)
        .join('');

/** Submit as the student. Resolves to when Canvas recorded it. */
export async function submitAssignment(target: SubmitTarget, input: SubmissionInput): Promise<Date> {
    const base = `/courses/${target.courseId}/assignments/${target.assignmentId}`;
    const form = new URLSearchParams({ 'submission[submission_type]': input.kind });
    if (input.kind === 'online_text_entry') form.set('submission[body]', textToHtml(input.text));
    else if (input.kind === 'online_url') form.set('submission[url]', input.url.trim());
    else for (const file of input.files) form.append('submission[file_ids][]', await uploadFile(`${base}/submissions/self/files`, file));
    const submission = await canvasPost<RawSubmission>(`${base}/submissions`, form);
    return submission.submitted_at ? new Date(submission.submitted_at) : new Date();
}
