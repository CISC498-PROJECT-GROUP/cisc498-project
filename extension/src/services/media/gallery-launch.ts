// Getting into a course's Media Gallery the way Canvas does. The gallery is an LTI tool: Canvas signs
// a launch form for the student, the form is posted to Kaltura, and Kaltura answers with the gallery
// and a session for it. Canvas's sessionless_launch endpoint hands a student that signed form for any
// tool in their course — the same launch as clicking the tab, without opening it.
//
// Only the Canvas half is here (same-origin, the student's own session). Posting the form to Kaltura
// goes through the worker — see lectures.ts.

import { canvasGet } from '@/services/canvas/canvas-api';

export class LectureError extends Error {}

interface RawTab {
    id?: string;
    label?: string;
    type?: string;
    html_url?: string;
    hidden?: boolean;
}

export interface LaunchForm {
    action: string;
    fields: Record<string, string>;
}

/** The course's Media Gallery tool id, or null when the course has none. */
export async function galleryToolId(courseId: string): Promise<string | null> {
    const tabs = await canvasGet<RawTab[]>(`/courses/${courseId}/tabs`);
    const tab = tabs.find((t) => t.type === 'external' && /media\s*gallery/i.test(t.label ?? ''));
    const id = tab && (/context_external_tool_(\d+)/.exec(tab.id ?? '')?.[1] ?? /external_tools\/(\d+)/.exec(tab.html_url ?? '')?.[1]);
    return id ?? null;
}

/** The signed launch form for the gallery, read from the page Canvas renders for the launch. */
export async function galleryLaunch(courseId: string, toolId: string): Promise<LaunchForm> {
    const { url } = await canvasGet<{ url?: string }>(`/courses/${courseId}/external_tools/sessionless_launch`, { id: toolId, launch_type: 'course_navigation' });
    if (!url) throw new LectureError("Canvas wouldn't open this course's Media Gallery.");
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) throw new LectureError(`Canvas wouldn't open this course's Media Gallery (${response.status}).`);
    const page = new DOMParser().parseFromString(await response.text(), 'text/html');
    const forms = [...page.querySelectorAll('form')];
    const form = forms.find((f) => f.querySelector('input[name="oauth_signature"], input[name="lti_message_type"], input[name="id_token"]')) ?? forms[0];
    const action = form?.getAttribute('action');
    if (!form || !action) throw new LectureError("This course's Media Gallery uses a launch the assistant can't open.");
    const fields: Record<string, string> = {};
    for (const input of form.querySelectorAll<HTMLInputElement>('input[name]')) fields[input.name] = input.value;
    return { action: new URL(action, location.href).toString(), fields };
}
