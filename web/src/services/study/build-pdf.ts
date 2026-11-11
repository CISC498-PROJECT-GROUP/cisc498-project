// Building a study PDF from a course's recorded lectures, step by step against the backend:
//
//   lectures in the range → a digest of each → the plan → (study guide) every section, and video
//   links per unit, in parallel → the rendered PDF, attached to the assistant's reply.
//
// Each step is its own short request (see @canvas-assistant/shared types/study.ts), so progress shows
// as it goes and no single request outlives the worker. A section that fails twice is left out rather
// than losing the whole guide — unless most of them fail, which means something is wrong.

import type { CourseRef, ExamInfo, LectureRef, LinksResponse, RenderResponse, StudyDocument, StudyKind, StudyPlan, StudySection } from '@canvas-assistant/shared';
import { callBackend } from '@/services/api/backend';
import { loadCourses } from '@/services/canvas/courses';
import { isoDay } from '@/services/format/dates';
import { LectureError, loadLectures } from '@/services/media/lectures';
import { pdfAttachment } from '@/services/study/attachments';
import { courseRef } from '@/services/study/course-ref';
import { digestLectures, retryOnce } from '@/services/study/digests';
import { inRange } from '@/services/study/lecture-range';
import { mapLimit } from '@/services/study/pool';
import { courseVideos } from '@/services/study/resources';
import type { Attachment, Course } from '@/services/types';

/** A semester of lectures; more than this in one PDF is a range that needs narrowing. */
export const MAX_LECTURES = 40;

export interface PdfRequest {
    courseId: string;
    kind: StudyKind;
    from: string;
    to: string;
    title: string;
    exam: ExamInfo;
}

export interface PdfResult {
    attachment: Attachment;
    lectures: LectureRef[];
    missing: LectureRef[];
    sectionsLeftOut: number;
    complete: boolean;
}

export async function findCourse(courseId: string): Promise<Course> {
    const course = (await loadCourses()).find((c) => c.id === courseId);
    if (!course) throw new LectureError(`No active course has id ${courseId}.`);
    return course;
}

async function writeSections(course: CourseRef, plan: StudyPlan, digests: { lecture: LectureRef }[], progress: (label: string) => void): Promise<{ sections: StudySection[]; failed: number }> {
    const all = plan.units.flatMap((unit) => unit.sections.map((section) => ({ unit, section })));
    let done = 0;
    let failed = 0;
    const written = await mapLimit(all, 4, async ({ unit, section }) => {
        const unitDigests = digests.filter((d) => unit.lecture_ids.includes(d.lecture.id));
        try {
            return await retryOnce(() => callBackend<StudySection>('POST', '/study/section', { course, plan, section: section.number, digests: unitDigests.length > 0 ? unitDigests : digests }));
        } catch {
            failed++;
            return null;
        } finally {
            progress(`Writing the guide — ${++done} of ${all.length} sections`);
        }
    });
    if (failed > all.length / 2) throw new LectureError("The study guide couldn't be written right now — try again in a few minutes.");
    return { sections: written.filter((s): s is StudySection => s !== null), failed };
}

export async function buildStudyPdf(request: PdfRequest, progress: (label: string) => void): Promise<PdfResult> {
    const course = await findCourse(request.courseId);
    const ref = courseRef(course);
    progress('Opening the Media Gallery');
    const { lectures: all, complete } = await loadLectures(course.id);
    const lectures = inRange(all, request.from, request.to);
    if (lectures.length === 0) throw new LectureError(`The Media Gallery has no recordings between ${request.from} and ${request.to}.`);
    if (lectures.length > MAX_LECTURES) throw new LectureError(`That range holds ${lectures.length} recordings — narrow it to at most ${MAX_LECTURES}.`);

    const { digests, missing } = await digestLectures(course.id, ref, lectures, progress);
    if (digests.length === 0) throw new LectureError('None of the recordings in that range have captions the assistant can read.');

    progress('Planning the document');
    const range = { from: request.from, to: request.to };
    const plan = await retryOnce(() => callBackend<StudyPlan>('POST', '/study/plan', { kind: request.kind, course: ref, title: request.title, range, exam: request.exam, digests }));

    let sections: StudySection[] = [];
    let links: LinksResponse['sections'] = [];
    let sectionsLeftOut = 0;
    if (request.kind === 'study_guide') {
        const resources = await courseVideos(course.id);
        const linking = mapLimit(plan.units, 2, (unit) => callBackend<LinksResponse>('POST', '/study/links', { course: ref, unit, resources }).catch(() => ({ sections: [] })));
        const written = await writeSections(ref, plan, digests, progress);
        sections = written.sections;
        sectionsLeftOut = written.failed;
        links = (await linking).flatMap((result) => result.sections);
    }

    progress('Laying out the PDF');
    const doc: StudyDocument = { kind: request.kind, course: ref, range, generated: isoDay(new Date()), lectures: digests.map((d) => d.lecture), missing, plan, sections, links };
    const rendered = await retryOnce(() => callBackend<RenderResponse>('POST', '/study/render', doc));
    return { attachment: pdfAttachment(rendered, plan.title.replace(/\s*\n\s*/g, ' ')), lectures: doc.lectures, missing, sectionsLeftOut, complete };
}
