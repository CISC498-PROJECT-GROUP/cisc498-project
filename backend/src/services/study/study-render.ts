// POST /study/render: a built StudyDocument → the PDF, base64, with its page count and a filename.
// Rendering is deterministic — no model call — so the same document always prints the same guide.

import type { RenderResponse, StudyDocument } from '@canvas-assistant/shared';
import { BrowserUnavailableError, printPdf } from '@/services/common/svc-browser';
import { createLogger } from '@/services/common/svc-log';
import { flatTitle, renderHtml } from '@/services/study/render/document';
import { StudyRenderUnavailableError } from '@/services/study/study-errors';

const log = createLogger('study');

/** Pages in a Chrome-printed PDF: one "/Type /Page" object each ("/Pages" is the tree). */
export const countPages = (pdf: Uint8Array): number =>
    (
        Buffer.from(pdf)
            .toString('latin1')
            .match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []
    ).length;

/** "CISC304 Midterm Study Guide.pdf", with the characters file systems reject removed. */
export const pdfFilename = (doc: StudyDocument): string =>
    `${[doc.course.code, flatTitle(doc)].filter(Boolean).join(' ')}`
        .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120) + '.pdf';

export async function renderStudyPdf(doc: StudyDocument): Promise<RenderResponse> {
    const started = performance.now();
    const html = renderHtml(doc);
    let pdf: Uint8Array;
    try {
        pdf = await printPdf(html);
    } catch (error) {
        if (error instanceof BrowserUnavailableError) throw new StudyRenderUnavailableError(error.message);
        throw error;
    }
    const pages = countPages(pdf);
    log.info('render complete', { kind: doc.kind, sections: doc.sections.length, pages, kb: Math.round(pdf.length / 1024), ms: Math.round(performance.now() - started) });
    return { pdf: Buffer.from(pdf).toString('base64'), pages, filename: pdfFilename(doc) };
}
