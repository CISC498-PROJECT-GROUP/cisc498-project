// HTML-building helpers for the renderer. Every piece of text that reaches the page — model output
// and course names alike — goes through esc() or inline(); markup is only ever written here.

export const esc = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** A CSS string literal, for `content:` in the page's footer. */
export const cssString = (text: string): string =>
    `"${text
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/[\r\n]+/g, ' ')}"`;

/** Joins the parts that are not empty. */
export const join = (...parts: (string | false | null | undefined)[]): string => parts.filter(Boolean).join('');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-07" → "Oct 7". Anything else comes back as it was. */
export const shortDate = (day: string): string => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
    return match ? `${MONTHS[Number(match[2]) - 1] ?? match[2]} ${Number(match[3])}` : day;
};

/** "2026-10-07" → "Oct 7, 2026". */
export const longDate = (day: string): string => {
    const match = /^(\d{4})-\d{2}-\d{2}$/.exec(day);
    return match ? `${shortDate(day)}, ${match[1]}` : day;
};

/** The two small icons the design uses, drawn rather than typed so no font has to carry them. */
export const STAR = '<svg class="g-i" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3l-5.8 3.1 1.2-6.5-4.8-4.5 6.5-.8z"/></svg>';

export const PLAY = '<svg class="g-i" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4.5v15l12.5-7.5z"/></svg>';

export const CHECK = '<svg class="g-i" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.5l5 5L19.5 7"/></svg>';
