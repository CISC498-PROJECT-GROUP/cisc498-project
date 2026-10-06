// The fake Canvas's write side: the three-step file upload and the submission itself. Submissions
// are held in memory for as long as the preview server runs, so a submitted assignment shows as
// turned in on the next planner load. Nothing is checked beyond what the widget relies on.

const json = (body: unknown, status = 200) => Response.json(body, { status });

/** Assignment id → when it was submitted. */
export const SUBMITTED = new Map<number, string>();

/** Which ways each fixture assignment takes work, so the form's toggle and its notices all show. */
export const submissionTypes = (id: number): { submission_types: string[]; allowed_extensions?: string[] } => {
    if (id === 1003) return { submission_types: ['online_upload'], allowed_extensions: ['py'] };
    if (id === 1012) return { submission_types: ['online_quiz'] };
    if (id === 3002) return { submission_types: ['on_paper'] };
    if (id % 2 === 0) return { submission_types: ['online_text_entry', 'online_url', 'online_upload'] };
    return { submission_types: ['online_text_entry', 'online_upload'] };
};

let nextFileId = 9000;

export async function submissionRoute(req: Request, url: URL): Promise<Response> {
    const p = url.pathname.replace(/^\/api\/v1/, '');
    let m: RegExpExecArray | null;
    if (!req.headers.get('x-csrf-token')) return json({ errors: [{ message: 'Invalid authenticity token' }] }, 422);

    if (/^\/courses\/\d+\/assignments\/\d+\/submissions\/self\/files$/.test(p)) {
        const form = new URLSearchParams(await req.text());
        return json({ upload_url: '/preview-upload', upload_params: { filename: form.get('name') ?? 'file' } });
    }
    if ((m = /^\/courses\/\d+\/assignments\/(\d+)\/submissions$/.exec(p))) {
        const form = new URLSearchParams(await req.text());
        const type = form.get('submission[submission_type]');
        if (type === 'online_text_entry' && !form.get('submission[body]')) return json({ errors: { body: [{ message: 'body is required' }] } }, 400);
        const at = new Date().toISOString();
        SUBMITTED.set(Number(m[1]), at);
        return json({ submission_type: type, submitted_at: at, workflow_state: 'submitted', attempt: 1 }, 201);
    }
    return json({ errors: [{ message: `preview can't write ${p}` }] }, 404);
}

/** Step two of an upload: the storage host. Answers like inst-fs does, with the new file's JSON. */
export async function uploadRoute(req: Request): Promise<Response> {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return json({ message: 'no file' }, 400);
    return json({ id: nextFileId++, display_name: file.name, size: file.size }, 201);
}
