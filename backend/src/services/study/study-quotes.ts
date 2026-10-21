// Quotes are the one place a study guide puts words in the instructor's mouth, so every quote is
// checked against its source before it ships: a lecture digest's quotes against the transcript, and
// a guide's quotes against the digests. A quote that can't be found is dropped, never repaired.
//
// The match ignores case, punctuation, spacing and filler words. Captions have no punctuation and
// the model may add it; "um" and "uh" are noise the model is told it may drop. Nothing else may differ.

const FILLER = new Set(['um', 'uh', 'erm', 'er', 'hmm', 'mm']);

/** Lower-case words joined by single spaces, punctuation and filler removed. */
export function normalizeQuote(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[‘’']/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .split(' ')
        .filter((word) => word !== '' && !FILLER.has(word))
        .join(' ');
}

/** A normalized haystack to search many quotes against. */
export const quoteSource = (...texts: string[]): string => ` ${texts.map(normalizeQuote).join(' | ')} `;

/** True when `quote` appears in `source` (from quoteSource) as whole words. Quotes of fewer than
    three words prove nothing and fail. */
export function quoteFound(quote: string, source: string): boolean {
    const needle = normalizeQuote(quote);
    if (needle.split(' ').length < 3) return false;
    return source.includes(` ${needle} `);
}

/** Strips the quotation marks a model wraps around a quoted fragment. */
export const unquote = (text: string): string =>
    text
        .trim()
        .replace(/^["“”'‘’]+|["“”'‘’]+$/g, '')
        .trim();
