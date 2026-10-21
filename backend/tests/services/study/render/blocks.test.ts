// Rendering quirks found in real generated guides: TeX the model reaches for (\bmod, \log_2, words in
// \text, big numbers), lists written inside a text field, a table header missing its first cell, a
// walkthrough without a label, and escaped characters left in diagram text.

import { describe, expect, it } from 'bun:test';
import { renderBlock, table } from '@/services/study/render/blocks';
import { texToMathml } from '@/services/study/render/math';
import { sanitizeSvg } from '@/services/study/render/svg';

const ctx = { saidLabel: () => 'In lecture', nextId: () => 'd1' };

describe('math the model writes', () => {
    it('sets \\bmod as a spaced operator, not the letters b-m-o-d', () => {
        const math = texToMathml('k \\bmod m');
        expect(math).toContain('<mo lspace="0.3em" rspace="0.3em">mod</mo>');
        expect(math).not.toContain('bmod');
    });

    it('puts a function subscript on the function name, with a thin space after', () => {
        expect(texToMathml('\\log_2 n')).toContain('<msub><mi mathvariant="normal">log</mi><mn>2</mn></msub><mspace width="0.17em"/><mi>n</mi>');
    });

    it('keeps the spaces inside \\text and reads a number with thousands commas as one number', () => {
        expect(texToMathml('n \\ge 1 \\text{ for all } n')).toContain('<mtext>&#160;for&#160;all&#160;</mtext>');
        expect(texToMathml('1,000,000')).toBe('<math><mrow><mn>1,000,000</mn></mrow></math>');
        expect(texToMathml('f(a, b)')).toContain('<mo>,</mo>');
    });
});

describe('blocks', () => {
    it('turns dash or numbered lines in a text field into a list', () => {
        const html = renderBlock({ type: 'text', text: 'Rules:\n- one\n- **two**\nAfter.' }, ctx);
        expect(html).toBe('<p class="g-p">Rules:</p><ul class="g-list"><li>one</li><li><strong>two</strong></li></ul><p class="g-p">After.</p>');
        expect(renderBlock({ type: 'text', text: '1. first\n2. second' }, ctx)).toBe('<ol class="g-list"><li>first</li><li>second</li></ol>');
    });

    it('gives a header that is short of its rows an empty first cell', () => {
        const html = table({ columns: ['Linear', 'Binary'], rows: [['Cost', 'O(n)', 'O(log n)']], highlight: [] });
        expect(html).toContain('<thead><tr><th></th><th>Linear</th><th>Binary</th></tr></thead>');
    });

    it('labels a walkthrough that came without one', () => {
        expect(renderBlock({ type: 'walkthrough', variant: 'walkthrough', label: '', prompt: 'p', table: null, steps: ['s'], note: '' }, ctx)).toContain('<div class="g-label">Walkthrough</div>');
        expect(renderBlock({ type: 'walkthrough', variant: 'try', label: ' ', prompt: 'p', table: null, steps: ['s'], note: '' }, ctx)).toContain('<div class="g-label">Try it</div>');
    });

    it('decodes characters a diagram left escaped', () => {
        const escaped = String.fromCharCode(92) + 'u00d7';
        expect(sanitizeSvg(`<svg viewBox="0 0 1 1"><text>n ${escaped} n</text></svg>`, 'd')).toBe('<svg viewBox="0 0 1 1"><text>n × n</text></svg>');
    });
});
