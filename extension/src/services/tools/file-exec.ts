// read_file: fetch a course file's bytes and hand them to the model in a form it can read.
// PDFs go back as a `document` block — the model reads the PDF itself, layout and tables included.
// Text-like files and DOCX files go back as text. Other Office formats are left as links.
//
// The download itself runs in the background worker (see background.ts): a Canvas file URL
// redirects to a storage host on another origin, which the page cannot read but the worker can.

import type { ContentBlock } from '@canvas-assistant/shared';
import type { FileReply } from '@/services/api/messages';
import { canvasGet } from '@/services/canvas/canvas-api';
import { htmlToText } from '@/services/canvas/html-text';
import { inExtension } from '@/services/config';
import { parseDocx } from '@/services/tools/docx';
import { clip, need, type ToolInput, type ToolOutput } from '@/services/tools/tool-helpers';

/** The Messages API takes 32 MB per request and base64 adds a third; stay well inside it. */
const MAX_BYTES = 12 * 1024 * 1024;

const TEXT_TYPES = /^(text\/|application\/(json|xml|csv|x-yaml))/;

async function download(url: string): Promise<FileReply> {
    if (inExtension()) return (await chrome.runtime.sendMessage({ type: 'file', url, maxBytes: MAX_BYTES })) as FileReply;
    const response = await fetch(url, { credentials: 'same-origin' });
    const contentType = (response.headers.get('content-type') ?? '').split(';')[0]!.trim();
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { ok: response.ok, status: response.status, contentType, base64: btoa(binary) };
}

const decode = (base64: string): string => new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));

export async function readFile(input: ToolInput): Promise<ToolOutput> {
    const meta = await canvasGet<{ display_name?: string; 'content-type'?: string; size?: number; url?: string; locked_for_user?: boolean }>(`/files/${need(input, 'file_id')}`);
    const name = meta.display_name ?? 'file';
    if (meta.locked_for_user || !meta.url) return `"${name}" is locked or not downloadable for students right now.`;
    if ((meta.size ?? 0) > MAX_BYTES) return `"${name}" is ${Math.round((meta.size ?? 0) / 1e6)} MB — too large to read here.`;

    const type = meta['content-type'] ?? '';
    const isPdf = type === 'application/pdf' || name.toLowerCase().endsWith('.pdf');
    const isDocx = type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.toLowerCase().endsWith('.docx');
    if (!isPdf && !isDocx && !TEXT_TYPES.test(type)) return `"${name}" is a ${type || 'binary'} file, which can't be read here. Link the student to it instead.`;

    const file = await download(meta.url);
    if (!file.ok) return `Couldn't download "${name}": ${file.error ?? `HTTP ${file.status}`}.`;

    if (isPdf) {
        const block: ContentBlock = { type: 'document', title: name, source: { type: 'base64', media_type: 'application/pdf', data: file.base64 } };
        return [{ type: 'text', text: `Contents of "${name}":` }, block];
    }
    if (isDocx) {
        try {
            return clip(`Contents of "${name}":\n\n${parseDocx(decode(file.base64))}`);
        } catch {
            return `"${name}" could not be read as a Word document. Link the student to it instead.`;
        }
    }
    const text = decode(file.base64);
    return clip(`Contents of "${name}":\n\n${type === 'text/html' ? htmlToText(text) : text}`);
}
