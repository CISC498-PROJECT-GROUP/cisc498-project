// Executors for the recorded-lecture tools — the course's Media Gallery. Listing reads the gallery;
// summarizing digests each lecture's captions through the backend; a study PDF runs the whole
// pipeline (services/study/build-pdf.ts) and comes back as a file attached to the reply.

import type { LectureDigest } from '@canvas-assistant/shared';
import { dayStamp } from '@/services/format/dates';
import { loadLectures } from '@/services/media/lectures';
import { buildStudyPdf, findCourse } from '@/services/study/build-pdf';
import { courseRef } from '@/services/study/course-ref';
import { digestLectures } from '@/services/study/digests';
import { inRange } from '@/services/study/lecture-range';
import { clip, need, needDay, optional, toJson, ToolInputError, type ToolContext, type ToolInput, type ToolResult } from '@/services/tools/tool-helpers';

/** A summary reads every lecture's captions; more than this at once is a range to narrow. */
const MAX_SUMMARIZED = 20;

const INCOMPLETE = 'Only the newest recordings on the gallery page could be read; older ones may be missing from this list.';

/** The dates to read, and the basis the model gave for them — a range with none means it guessed. */
function range(input: ToolInput): { from: string; to: string } {
    const from = needDay(input, 'from');
    const to = needDay(input, 'to');
    if (from > to) throw new ToolInputError('"from" must be on or before "to".');
    need(input, 'range_basis');
    return { from, to };
}

export async function listLectures(input: ToolInput, context: ToolContext): Promise<string> {
    const course = await findCourse(need(input, 'course_id'));
    context.progress('Opening the Media Gallery');
    const { lectures, complete } = await loadLectures(course.id);
    if (lectures.length === 0) return "The course's Media Gallery has no recordings.";
    const rows = lectures.map((l) => ({ lecture_id: l.id, title: l.title, recorded: l.date ? dayStamp(l.date) : 'unknown', minutes: l.minutes }));
    return `${complete ? '' : `${INCOMPLETE}\n`}${toJson(rows)}`;
}

const section = (heading: string, lines: string[]): string => (lines.length === 0 ? '' : `${heading}:\n${lines.map((line) => `- ${line}`).join('\n')}`);

export const digestText = (d: LectureDigest): string =>
    [
        `## ${d.lecture.title} — recorded ${dayStamp(d.lecture.date)}${d.lecture.minutes ? ` (${d.lecture.minutes} min)` : ''}`,
        d.summary,
        section(
            'Topics',
            d.topics.map((t) => `${t.title}: ${t.points.join('; ')}`),
        ),
        section(
            'Definitions',
            d.definitions.map((x) => `${x.term} — ${x.meaning}`),
        ),
        section(
            'Formulas',
            d.formulas.map((f) => `${f.name}: ${f.tex}${f.note ? ` (${f.note})` : ''}`),
        ),
        section(
            'Worked examples',
            d.examples.map((e) => `${e.title}: ${e.setup} → ${e.answer}`),
        ),
        section(
            'Instructor quotes (verbatim)',
            d.quotes.map((q) => `"${q.text}" — ${q.about}`),
        ),
        section('About exams', d.exam_notes),
        section('Mistakes the instructor warned about', d.traps),
        section('Skipped or not on the exam', d.skipped),
    ]
        .filter(Boolean)
        .join('\n');

export async function summarizeLectures(input: ToolInput, context: ToolContext): Promise<string> {
    const course = await findCourse(need(input, 'course_id'));
    const { from, to } = range(input);
    context.progress('Opening the Media Gallery');
    const { lectures: all, complete } = await loadLectures(course.id);
    const lectures = inRange(all, from, to);
    if (lectures.length === 0) return `The Media Gallery has no recordings between ${dayStamp(from)} and ${dayStamp(to)}.${complete ? '' : ` ${INCOMPLETE}`}`;
    if (lectures.length > MAX_SUMMARIZED) return `That range holds ${lectures.length} recordings — summarize at most ${MAX_SUMMARIZED} at a time, so narrow the range.`;

    const { digests, missing } = await digestLectures(course.id, courseRef(course), lectures, context.progress);
    const parts = digests.map(digestText);
    if (missing.length > 0) parts.push(`No readable captions, so not summarized: ${missing.map((l) => `${l.title} (${dayStamp(l.date)})`).join('; ')}.`);
    if (!complete) parts.push(INCOMPLETE);
    return clip(parts.join('\n\n'));
}

export async function createStudyPdf(input: ToolInput, context: ToolContext): Promise<ToolResult> {
    const kind = input.kind === 'topics' ? 'topics' : 'study_guide';
    const { from, to } = range(input);
    const title = optional(input, 'title') ?? (kind === 'topics' ? 'Lecture Topics' : 'Study Guide');
    const exam = { name: optional(input, 'exam_name') ?? '', date: optional(input, 'exam_date') ?? '', notes: optional(input, 'exam_notes') ?? '' };

    const result = await buildStudyPdf({ courseId: need(input, 'course_id'), kind, from, to, title, exam }, context.progress);
    const first = result.lectures[0]?.date ?? from;
    const last = result.lectures[result.lectures.length - 1]?.date ?? to;
    const lines = [
        `Attached "${result.attachment.filename}" (${result.attachment.pages} pages): ${kind === 'topics' ? 'an outline of the topics' : 'a study guide'} built from ${result.lectures.length} recorded lectures, ${dayStamp(first)} to ${dayStamp(last)}.`,
        "The student has Download and Open buttons under your reply — say briefly what it covers; don't repeat its contents.",
    ];
    if (result.missing.length > 0) lines.push(`Left out — no readable captions: ${result.missing.map((l) => `${l.title} (${dayStamp(l.date)})`).join('; ')}.`);
    if (result.sectionsLeftOut > 0) lines.push(`${result.sectionsLeftOut} section(s) couldn't be written and are missing from the guide.`);
    if (!result.complete) lines.push(INCOMPLETE);
    return { content: lines.join('\n'), attachment: result.attachment };
}
