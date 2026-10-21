// The renderer's text handling: TeX → MathML, the inline markup, and diagram SVG cleaning. Every
// string here came from the model, so the tests are mostly about what it must NOT be able to do.

import { describe, expect, it } from 'bun:test';
import { inline } from '@/services/study/render/inline';
import { texToMathml } from '@/services/study/render/math';
import { sanitizeSvg } from '@/services/study/render/svg';

describe('texToMathml', () => {
    it('builds fractions, roots, scripts and symbols', () => {
        const math = texToMathml('\\frac{a}{b} + \\sqrt{x_i^2} \\le \\sigma', true);
        expect(math).toStartWith('<math display="block">');
        expect(math).toContain('<mfrac><mrow><mi>a</mi></mrow><mrow><mi>b</mi></mrow></mfrac>');
        expect(math).toContain('<msqrt><mrow><msubsup><mi>x</mi><mi>i</mi><mn>2</mn></msubsup></mrow></msqrt>');
        expect(math).toContain('<mo>≤</mo><mi>σ</mi>');
    });

    it('sets a word upright as one name and keeps brackets from stretching', () => {
        const math = texToMathml('(freq)');
        expect(math).toContain('<mi>freq</mi>');
        expect(math).toContain('<mo stretchy="false">(</mo>');
    });

    it('prints an unknown command as text and survives unbalanced braces', () => {
        expect(texToMathml('\\weird{x}')).toContain('<mtext>weird</mtext>');
        expect(() => texToMathml('\\frac{a}{b')).not.toThrow();
        expect(texToMathml('a}b')).toContain('<mi>b</mi>');
    });

    it('escapes text inside \\text', () => {
        expect(texToMathml('\\text{<b>}')).toContain('<mtext>&lt;b&gt;</mtext>');
    });
});

describe('inline', () => {
    it('renders bold, italic, code, answers and math', () => {
        expect(inline('**bold** and *it*')).toBe('<strong>bold</strong> and <em>it</em>');
        expect(inline('so ==42== it is')).toBe('so <span class="g-ans">42</span> it is');
        expect(inline('`x < y`')).toBe('<code>x &lt; y</code>');
        expect(inline('$x^2$')).toContain('<math><mrow><msup>');
    });

    it('escapes HTML and leaves unclosed or spaced marks as text', () => {
        expect(inline('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
        expect(inline('3 * 4 * 5')).toBe('3 * 4 * 5');
        expect(inline('costs $5 and $6')).toBe('costs $5 and $6');
        expect(inline('**open')).toBe('**open');
    });
});

describe('sanitizeSvg', () => {
    it('keeps drawing elements and drops script, handlers, links and foreign content', () => {
        const svg = sanitizeSvg(
            '<svg viewBox="0 0 10 10" width="500"><script>alert(1)</script><rect x="1" onclick="x()" fill="#000"/><a href="https://evil"><text>hi</text></a><foreignObject><div>x</div></foreignObject><image href="data:x"/></svg>',
            'd1',
        );
        expect(svg).toBe('<svg viewBox="0 0 10 10"><rect x="1" fill="#000"/></svg>');
    });

    it('prefixes ids and the references to them', () => {
        const svg = sanitizeSvg('<svg viewBox="0 0 10 10"><defs><marker id="arr"><path d="M0 0"/></marker></defs><line marker-end="url(#arr)"/></svg>', 'd7');
        expect(svg).toContain('id="d7-arr"');
        expect(svg).toContain('marker-end="url(#d7-arr)"');
    });

    it('rejects attribute values that reach outside, and anything that is not an SVG', () => {
        expect(sanitizeSvg('<svg viewBox="0 0 1 1"><rect fill="url(https://x/y)"/></svg>', 'd')).toBe('<svg viewBox="0 0 1 1"><rect/></svg>');
        expect(sanitizeSvg('<div>no</div>', 'd')).toBe('');
        expect(sanitizeSvg('<svg><rect/></svg>', 'd')).toBe('');
    });

    it('closes elements the model left open and escapes stray text', () => {
        expect(sanitizeSvg('<svg viewBox="0 0 1 1"><g><text>a < b & c', 'd')).toBe('<svg viewBox="0 0 1 1"><g><text>a &lt; b &amp; c</text></g></svg>');
    });
});
