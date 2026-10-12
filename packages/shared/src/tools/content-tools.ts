// Tools for course CONTENT — syllabus, pages, modules, files. Instructors put the same kind of
// information in very different places, so these are the tools for hunting it down.

const courseId = { type: 'string', description: 'Canvas course id, from list_courses or the course list in context.' };

export const CONTENT_TOOLS = [
    {
        name: 'get_syllabus',
        description:
            "The course's Syllabus page as text. Often empty or just a link — many instructors put the syllabus in a file (usually a PDF), a page, or a module instead; if so, look there with list_files / list_pages / list_modules.",
        input_schema: { type: 'object', properties: { course_id: courseId }, required: ['course_id'], additionalProperties: false },
    },
    {
        name: 'list_pages',
        description: 'The wiki pages in a course (title, url slug, last updated). Optionally filter by a search term matched against titles.',
        input_schema: {
            type: 'object',
            properties: { course_id: courseId, search: { type: 'string', description: 'Only pages whose title contains this, e.g. "syllabus".' } },
            required: ['course_id'],
            additionalProperties: false,
        },
    },
    {
        name: 'get_page',
        description: 'One wiki page as text.',
        input_schema: {
            type: 'object',
            properties: { course_id: courseId, page_url: { type: 'string', description: 'The page url slug from list_pages or a module item.' } },
            required: ['course_id', 'page_url'],
            additionalProperties: false,
        },
    },
    {
        name: 'list_modules',
        description: "A course's modules in order, each with its items (type, title, and the id or page slug needed to open it). Good for finding where a syllabus, schedule or reading lives.",
        input_schema: { type: 'object', properties: { course_id: courseId }, required: ['course_id'], additionalProperties: false },
    },
    {
        name: 'list_files',
        description: 'Files uploaded to a course (id, name, type, size, updated). Optionally filter by a search term, e.g. "syllabus" or "schedule". Some courses hide the Files list from students; module items still link files.',
        input_schema: {
            type: 'object',
            properties: { course_id: courseId, search: { type: 'string', description: 'Only files whose name contains this (2+ characters).' } },
            required: ['course_id'],
            additionalProperties: false,
        },
    },
    {
        name: 'read_file',
        description: 'Read one file by id. PDFs are returned as the document itself; text, HTML, CSV, Markdown and Google Docs-exported Word files as text. PowerPoint files cannot be read — say so and link the file instead.',
        input_schema: { type: 'object', properties: { file_id: { type: 'string', description: 'File id from list_files or a module item.' } }, required: ['file_id'], additionalProperties: false },
    },
] as const;
