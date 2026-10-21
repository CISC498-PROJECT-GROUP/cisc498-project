// Quote checking: a study guide may only attribute words to the instructor that are really in the
// recording. The match forgives what captions and models change (case, punctuation, "um") and
// nothing else.

import { describe, expect, it } from 'bun:test';
import { normalizeQuote, quoteFound, quoteSource, unquote } from '@/services/study/study-quotes';

const transcript = 'okay so um the midterm is Monday September 21st in class and it is closed book but you may bring one handwritten page of notes';

describe('quoteFound', () => {
    const source = quoteSource(transcript);

    it('finds a quote with punctuation, capitals and filler words changed', () => {
        expect(quoteFound('The midterm is Monday, September 21st, in class.', source)).toBe(true);
        expect(quoteFound('"It is closed book — but you may bring one handwritten page of notes."', source)).toBe(true);
    });

    it('rejects a paraphrase, a changed word, or words split across sources', () => {
        expect(quoteFound('The midterm is on Monday in class', source)).toBe(false);
        expect(quoteFound('the midterm is Tuesday September 21st', source)).toBe(false);
        const two = quoteSource('the exam covers trees', 'graphs are optional');
        expect(quoteFound('the exam covers trees graphs are optional', two)).toBe(false);
    });

    it('rejects quotes too short to prove anything', () => {
        expect(quoteFound('in class', source)).toBe(false);
    });

    it('matches whole words only', () => {
        expect(quoteFound('one handwritten page of note', source)).toBe(false);
    });
});

describe('normalizeQuote / unquote', () => {
    it('lower-cases, strips punctuation and filler, and collapses spaces', () => {
        expect(normalizeQuote("Um, it's   O(n²) — uh, right?")).toBe('its o n2 right');
    });

    it('strips the quotation marks wrapped around a fragment', () => {
        expect(unquote('  “If you master this table”  ')).toBe('If you master this table');
    });
});
