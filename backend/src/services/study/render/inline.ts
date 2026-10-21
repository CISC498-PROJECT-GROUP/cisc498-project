// The inline markup a block's text may carry, rendered to HTML: **bold**, *italic*, `code`,
// ==answer== (the green answer chip) and $tex$ (inline math). Everything else is escaped text. An
// opener without its closer is printed as itself — nothing a model writes can produce raw HTML.

import { esc } from '@/services/study/render/html';
import { texToMathml } from '@/services/study/render/math';

interface Mark {
    open: string;
    close: string;
    render: (inner: string) => string;
    /** Literal marks (code, math) do not parse what is inside them. */
    literal: boolean;
}

const MARKS: Mark[] = [
    { open: '$', close: '$', literal: true, render: (tex) => texToMathml(tex) },
    { open: '`', close: '`', literal: true, render: (code) => `<code>${esc(code)}</code>` },
    { open: '==', close: '==', literal: false, render: (html) => `<span class="g-ans">${html}</span>` },
    { open: '**', close: '**', literal: false, render: (html) => `<strong>${html}</strong>` },
    { open: '*', close: '*', literal: false, render: (html) => `<em>${html}</em>` },
];

/** The first mark that opens at `at` and closes later in the text, with where it closes. */
function markAt(text: string, at: number): { mark: Mark; end: number } | null {
    for (const mark of MARKS) {
        if (!text.startsWith(mark.open, at)) continue;
        const start = at + mark.open.length;
        const end = text.indexOf(mark.close, start + 1);
        // "a * b" and "$5 and $6" are not marks: the inside must start and end with a non-space.
        if (end === -1 || /\s/.test(text[start] ?? ' ') || /\s/.test(text[end - 1] ?? ' ')) continue;
        if (mark.open === '$' && /\d/.test(text[end + 1] ?? '')) continue;
        return { mark, end };
    }
    return null;
}

export function inline(text: string): string {
    let html = '';
    let plain = '';
    for (let at = 0; at < text.length;) {
        const found = markAt(text, at);
        if (!found) {
            plain += text[at];
            at++;
            continue;
        }
        const { mark, end } = found;
        const inner = text.slice(at + mark.open.length, end);
        html += esc(plain) + mark.render(mark.literal ? inner : inline(inner));
        plain = '';
        at = end + mark.close.length;
    }
    return (html + esc(plain)).replace(/\n/g, '<br>');
}
