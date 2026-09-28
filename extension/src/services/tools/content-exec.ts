// Executors for the course-content tools: syllabus, pages, modules, files.

import { absoluteUrl, canvasGet, canvasGetAll } from '@/services/canvas/canvas-api';
import type { RawCourse } from '@/services/canvas/canvas-types';
import { htmlToText } from '@/services/canvas/html-text';
import { localStamp } from '@/services/format/dates';
import { clip, need, optional, toJson, type ToolInput } from '@/services/tools/tool-helpers';

export async function getSyllabus(input: ToolInput): Promise<string> {
    const course = await canvasGet<RawCourse>(`/courses/${need(input, 'course_id')}`, { 'include[]': ['syllabus_body'] });
    const text = htmlToText(course.syllabus_body);
    if (text === '') return 'The Syllabus page for this course is empty. Look for the syllabus in list_files, list_pages or list_modules.';
    return clip(`Syllabus page for ${course.course_code ?? course.name}:\n\n${text}`);
}

export async function listPages(input: ToolInput): Promise<string> {
    const pages = await canvasGetAll<{ title?: string; url?: string; updated_at?: string; front_page?: boolean }>(`/courses/${need(input, 'course_id')}/pages`, { search_term: optional(input, 'search'), sort: 'title' }, 3);
    if (pages.length === 0) return 'No pages found (the Pages list may be hidden from students — try list_modules).';
    return toJson(pages.map((p) => ({ title: p.title, page_url: p.url, updated: localStamp(p.updated_at), front_page: p.front_page || undefined })));
}

export async function getPage(input: ToolInput): Promise<string> {
    const course = need(input, 'course_id');
    const page = await canvasGet<{ title?: string; body?: string; html_url?: string }>(`/courses/${course}/pages/${encodeURIComponent(need(input, 'page_url'))}`);
    return clip(`${page.title}\n${absoluteUrl(page.html_url)}\n\n${htmlToText(page.body) || '(empty page)'}`);
}

interface RawModule {
    name?: string;
    unlock_at?: string | null;
    items?: { title?: string; type?: string; content_id?: number; page_url?: string; html_url?: string; external_url?: string }[];
}

export async function listModules(input: ToolInput): Promise<string> {
    const modules = await canvasGetAll<RawModule>(`/courses/${need(input, 'course_id')}/modules`, { 'include[]': ['items'] }, 3);
    if (modules.length === 0) return 'This course has no modules visible to students.';
    return toJson(
        modules.map((m) => ({
            module: m.name,
            unlocks: localStamp(m.unlock_at),
            items: (m.items ?? []).map((i) => ({
                type: i.type,
                title: i.title,
                file_id: i.type === 'File' ? String(i.content_id) : undefined,
                assignment_id: i.type === 'Assignment' ? String(i.content_id) : undefined,
                page_url: i.page_url,
                url: i.external_url ?? absoluteUrl(i.html_url),
            })),
        })),
    );
}

export async function listFiles(input: ToolInput): Promise<string> {
    const search = optional(input, 'search');
    const files = await canvasGetAll<{ id: number; display_name?: string; 'content-type'?: string; size?: number; updated_at?: string }>(
        `/courses/${need(input, 'course_id')}/files`,
        { search_term: search && search.length >= 2 ? search : undefined, sort: 'name' },
        3,
    );
    if (files.length === 0) return search ? `No files matching "${search}".` : 'No files found.';
    return toJson(files.map((f) => ({ file_id: String(f.id), name: f.display_name, type: f['content-type'], size_kb: f.size ? Math.round(f.size / 1024) : undefined, updated: localStamp(f.updated_at) })));
}
