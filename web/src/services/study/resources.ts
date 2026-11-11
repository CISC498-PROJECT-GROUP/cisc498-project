// Videos the course itself links to — module items pointing at YouTube or Vimeo. A study guide shows
// the relevant ones as gold "posted" chips; the backend only accepts a gold chip whose URL is one of
// these, so a gold chip is always something the course really posted.

import { canvasGetAll } from '@/services/canvas/canvas-api';

const VIDEO = /^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i;

interface RawModule {
    items?: { title?: string; external_url?: string }[];
}

export async function courseVideos(courseId: string): Promise<{ title: string; url: string }[]> {
    const modules = await canvasGetAll<RawModule>(`/courses/${courseId}/modules`, { 'include[]': ['items'] }, 3).catch(() => [] as RawModule[]);
    return modules
        .flatMap((module) => module.items ?? [])
        .filter((item) => item.external_url && VIDEO.test(item.external_url))
        .map((item) => ({ title: item.title?.trim() || 'Course video', url: item.external_url! }))
        .slice(0, 40);
}
