// What the model is told about the student, and when. This rides in the CONVERSATION rather than
// the system prompt: the backend's system prompt is frozen so it stays cached, and a context block
// appended once at the start of a chat keeps the cached prefix growing instead of being rewritten.
//
// Every question also carries the time it was asked, so "due tonight" stays right in a chat that
// is left open for hours.

import type { ContentBlock } from '@canvas-assistant/shared';
import { loadCourses, loadStudent } from '@/services/canvas/courses';
import { localStamp, timeZone } from '@/services/format/dates';

export async function contextBlock(): Promise<ContentBlock> {
    const [student, courses] = await Promise.all([loadStudent().catch(() => null), loadCourses().catch(() => [])]);
    const lines = [
        '<context>',
        `Student: ${student?.name ?? 'unknown'}`,
        `Canvas site: ${location.origin}`,
        `Time zone: ${timeZone()}`,
        'Active courses (id · code · name):',
        ...(courses.length > 0 ? courses.map((c) => `- ${c.id} · ${c.code} · ${c.name}`) : ['- (could not load — use list_courses)']),
        '</context>',
    ];
    return { type: 'text', text: lines.join('\n') };
}

export const questionBlock = (question: string, now = new Date()): ContentBlock => ({ type: 'text', text: `[Asked ${localStamp(now.toISOString())}]\n${question}` });
