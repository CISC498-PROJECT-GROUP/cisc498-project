// Canvas stores rich content (syllabi, pages, assignment instructions, announcements) as HTML. The
// model reads text, so this turns HTML into plain text that keeps what carries meaning — paragraph
// and list structure, table rows, link targets — and drops the markup.
//
// DOMParser builds an inert document: scripts do not run and images do not load.

const BLOCKS = new Set(['P', 'DIV', 'BR', 'LI', 'TR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TABLE', 'UL', 'OL', 'SECTION', 'BLOCKQUOTE', 'PRE', 'HR']);

function walk(node: Node, out: string[]): void {
    if (node.nodeType === Node.TEXT_NODE) {
        out.push(node.textContent ?? '');
        return;
    }
    if (!(node instanceof Element)) return;
    if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
    if (node.tagName === 'LI') out.push('\n- ');
    else if (BLOCKS.has(node.tagName)) out.push('\n');
    if (node.tagName === 'TD' || node.tagName === 'TH') out.push(' | ');
    for (const child of node.childNodes) walk(child, out);
    if (node.tagName === 'A') {
        const href = node.getAttribute('href');
        if (href && !href.startsWith('#') && href !== node.textContent?.trim()) out.push(` (${new URL(href, location.origin).toString()})`);
    }
    if (BLOCKS.has(node.tagName)) out.push('\n');
}

export function htmlToText(html: string | null | undefined): string {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const out: string[] = [];
    walk(doc.body, out);
    return out
        .join('')
        .replace(/[ \t ]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
