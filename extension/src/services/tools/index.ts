// Runs one tool call from the model. The Record type below is keyed by the shared tool names, so a
// tool added to @canvas-assistant/shared without an executor here does not compile.
//
// A failure never throws out of runTool: it becomes an error tool_result, which lets the model
// read what went wrong ("Canvas doesn't let students see this") and try another route.
//
// A long tool reports what it is doing through context.progress; a tool that makes a file returns it
// as an attachment, which the chat shows under the assistant's reply.

import type { CanvasToolName } from '@canvas-assistant/shared';
import { getSyllabus, getPage, listFiles, listModules, listPages } from '@/services/tools/content-exec';
import { getAssignment, gradeBreakdown, listAnnouncements, listAssignments, listCourses, upcomingWork } from '@/services/tools/course-exec';
import { readFile } from '@/services/tools/file-exec';
import { createStudyPdf, listLectures, summarizeLectures } from '@/services/tools/lecture-exec';
import type { ToolContext, ToolInput, ToolOutput, ToolResult } from '@/services/tools/tool-helpers';
import type { Attachment } from '@/services/types';

const EXECUTORS: Record<CanvasToolName, (input: ToolInput, context: ToolContext) => Promise<ToolOutput | ToolResult>> = {
    list_courses: listCourses,
    get_upcoming_work: upcomingWork,
    list_assignments: listAssignments,
    get_assignment: getAssignment,
    get_grade_breakdown: gradeBreakdown,
    list_announcements: listAnnouncements,
    get_syllabus: getSyllabus,
    list_pages: listPages,
    get_page: getPage,
    list_modules: listModules,
    list_files: listFiles,
    read_file: readFile,
    list_lectures: listLectures,
    summarize_lectures: summarizeLectures,
    create_study_pdf: createStudyPdf,
};

export interface ToolRun {
    content: ToolOutput;
    isError: boolean;
    attachment?: Attachment;
}

const isResult = (output: ToolOutput | ToolResult): output is ToolResult => typeof output === 'object' && !Array.isArray(output);

export async function runTool(name: string, input: unknown, context: ToolContext = { progress: () => undefined }): Promise<ToolRun> {
    const executor = EXECUTORS[name as CanvasToolName];
    if (!executor) return { content: `Unknown tool "${name}".`, isError: true };
    try {
        const output = await executor(typeof input === 'object' && input !== null ? (input as ToolInput) : {}, context);
        return isResult(output) ? { content: output.content, isError: false, attachment: output.attachment } : { content: output, isError: false };
    } catch (error) {
        return { content: error instanceof Error ? error.message : String(error), isError: true };
    }
}

/** What the chat shows while a tool runs. */
export const TOOL_ACTIVITY: Record<CanvasToolName, string> = {
    list_courses: 'Checking your courses',
    get_upcoming_work: 'Checking your planner',
    list_assignments: 'Looking at assignments',
    get_assignment: 'Reading the assignment',
    get_grade_breakdown: 'Looking at your grades',
    list_announcements: 'Reading announcements',
    get_syllabus: 'Reading the syllabus',
    list_pages: 'Looking through course pages',
    get_page: 'Reading a course page',
    list_modules: 'Looking through modules',
    list_files: 'Searching course files',
    read_file: 'Reading a file',
    list_lectures: 'Looking through recorded lectures',
    summarize_lectures: 'Reading recorded lectures',
    create_study_pdf: 'Building your PDF',
};
