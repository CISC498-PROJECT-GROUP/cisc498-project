// A deliberately small Markdown parser for assistant answers: paragraphs, bullet and numbered lists,
// **bold**, *italic*, `code` and [links](url). The system prompt asks for exactly this subset.
// It produces a token tree, never HTML, so rendering it cannot inject markup; links are allowed
// only to http(s) URLs and site-relative paths.

export type Inline = { kind: 'text'; text: string } | { kind: 'code'; text: string } | { kind: 'bold'; children: Inline[] } | { kind: 'italic'; children: Inline[] } | { kind: 'link'; text: string; href: string };

export type Block = { kind: 'p'; lines: Inline[][] } | { kind: 'ul' | 'ol'; items: Inline[][] };

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;

export const safeHref = (href: string, origin: string): string | null => {
    try {
        const url = new URL(href, origin);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
    } catch {
        return null;
    }
};

export function parseInline(line: string, origin: string): Inline[] {
    const out: Inline[] = [];
    let last = 0;
    for (const match of line.matchAll(INLINE)) {
        const token = match[0];
        if (match.index! > last) out.push({ kind: 'text', text: line.slice(last, match.index) });
        last = match.index! + token.length;
        if (token.startsWith('**') || token.startsWith('__')) out.push({ kind: 'bold', children: parseInline(token.slice(2, -2), origin) });
        else if (token.startsWith('`')) out.push({ kind: 'code', text: token.slice(1, -1) });
        else if (token.startsWith('[')) {
            const [, text, href] = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token)!;
            const safe = safeHref(href!, origin);
            out.push(safe ? { kind: 'link', text: text!, href: safe } : { kind: 'text', text: text! });
        } else out.push({ kind: 'italic', children: parseInline(token.slice(1, -1), origin) });
    }
    if (last < line.length) out.push({ kind: 'text', text: line.slice(last) });
    return out;
}

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

export function parseMarkdown(source: string, origin: string): Block[] {
    const blocks: Block[] = [];
    const open: { block: Block | null } = { block: null };
    const flush = () => {
        if (open.block) blocks.push(open.block);
        open.block = null;
    };

    for (const raw of source.replace(/\r\n/g, '\n').split('\n')) {
        const line = raw.replace(/^#{1,6}\s+(.*)$/, '**$1**');
        const bullet = BULLET.exec(line);
        const numbered = bullet ? null : NUMBERED.exec(line);
        const current = open.block;
        if (line.trim() === '') flush();
        else if (bullet || numbered) {
            const kind = bullet ? 'ul' : 'ol';
            const items = parseInline((bullet ?? numbered)![1]!, origin);
            if (current && current.kind === kind) current.items.push(items);
            else {
                flush();
                open.block = { kind, items: [items] };
            }
        } else if (current && current.kind === 'p') current.lines.push(parseInline(line, origin));
        else {
            flush();
            open.block = { kind: 'p', lines: [parseInline(line, origin)] };
        }
    }
    flush();
    return blocks;
}
