import { describe, expect, it } from 'bun:test';
import { parseInline, parseMarkdown, safeHref } from '@/services/format/markdown';

// Answers are rendered from this parser's tokens, never as HTML — so the parser is the XSS
// boundary. A link may only ever point at http(s).

const ORIGIN = 'https://canvas.example.edu';

describe('markdown', () => {
    it('parses bold, code, italic and links', () => {
        expect(parseInline('**Due** `Fri` at *noon*, see [HW](/courses/1/assignments/2)', ORIGIN)).toEqual([
            { kind: 'bold', children: [{ kind: 'text', text: 'Due' }] },
            { kind: 'text', text: ' ' },
            { kind: 'code', text: 'Fri' },
            { kind: 'text', text: ' at ' },
            { kind: 'italic', children: [{ kind: 'text', text: 'noon' }] },
            { kind: 'text', text: ', see ' },
            { kind: 'link', text: 'HW', href: 'https://canvas.example.edu/courses/1/assignments/2' },
        ]);
    });

    it('parses a link inside bold', () => {
        expect(parseInline('**[HW 6](/courses/1/assignments/2)**', ORIGIN)).toEqual([{ kind: 'bold', children: [{ kind: 'link', text: 'HW 6', href: 'https://canvas.example.edu/courses/1/assignments/2' }] }]);
    });

    it('refuses javascript: and data: links, keeping their text', () => {
        expect(safeHref('javascript:alert(1)', ORIGIN)).toBeNull();
        expect(parseInline('[click](javascript:void0)', ORIGIN)).toEqual([{ kind: 'text', text: 'click' }]);
        expect(safeHref('data:text/html,x', ORIGIN)).toBeNull();
    });

    it('groups lists and paragraphs', () => {
        const blocks = parseMarkdown('Two things:\n- HW 6\n- PS 5\n\n1. first\n2. second', ORIGIN);
        expect(blocks.map((b) => b.kind)).toEqual(['p', 'ul', 'ol']);
        expect(blocks[1]).toMatchObject({ items: [[{ text: 'HW 6' }], [{ text: 'PS 5' }]] });
    });

    it('turns a heading into a bold line rather than markup', () => {
        expect(parseMarkdown('## Late policy', ORIGIN)).toEqual([{ kind: 'p', lines: [[{ kind: 'bold', children: [{ kind: 'text', text: 'Late policy' }] }]] }]);
    });
});
