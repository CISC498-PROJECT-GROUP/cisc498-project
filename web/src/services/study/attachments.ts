// A file the assistant made, attached to its reply. The bytes live in a blob: URL for the page's
// lifetime — the student downloads or opens it from there, and nothing is stored anywhere else.

import type { RenderResponse } from '@canvas-assistant/shared';
import type { Attachment } from '@/services/types';

export function pdfAttachment(rendered: RenderResponse, title: string): Attachment {
    const bytes = Uint8Array.from(atob(rendered.pdf), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    return { kind: 'pdf', title, filename: rendered.filename, url, pages: rendered.pages, bytes: bytes.length };
}
