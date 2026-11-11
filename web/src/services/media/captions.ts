// Caption files → the plain text of what was said. Kaltura serves captions as SRT, WebVTT or DFXP
// (TTML); all three are cues with timings, and only the words matter here. Cue numbers, timings,
// styling tags and the repeats rolling captions produce are dropped. Pure, so it is tested directly.

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

const decode = (text: string): string =>
    text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
        if (code[0] === '#') return String.fromCodePoint(code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10));
        return ENTITIES[code.toLowerCase()] ?? whole;
    });

const stripTags = (text: string): string => text.replace(/<[^>]*>/g, ' ');

/** Joins cue texts, dropping a cue that repeats the end of the one before (rolling captions). */
function joinCues(cues: string[]): string {
    const out: string[] = [];
    for (const raw of cues) {
        const cue = raw.replace(/\s+/g, ' ').trim();
        if (cue === '' || cue === out[out.length - 1]) continue;
        out.push(cue);
    }
    return out
        .join(' ')
        .replace(/\s+([,.;:!?])/g, '$1')
        .trim();
}

/** SRT and WebVTT: a cue is an optional id line, a timing line, then its text up to a blank line.
    Only lines after a timing line are text, so ids, headers and NOTE blocks fall away. */
function fromTimed(text: string): string {
    const cues: string[] = [];
    let current: string[] = [];
    let inCue = false;
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed === '') {
            if (current.length > 0) cues.push(current.join(' '));
            current = [];
            inCue = false;
        } else if (trimmed.includes('-->')) {
            inCue = true;
        } else if (inCue) {
            current.push(decode(stripTags(trimmed)));
        }
    }
    if (current.length > 0) cues.push(current.join(' '));
    return joinCues(cues);
}

function fromDfxp(xml: string): string {
    const cues = [...xml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((match) => decode(stripTags(match[1]!.replace(/<br\s*\/?>/gi, ' '))));
    return joinCues(cues);
}

/** The words of a caption file, whatever its format. */
export function captionsToText(file: string): string {
    const text = file.replace(/^\uFEFF/, '');
    if (/^\s*<\?xml|<tt[\s>]/i.test(text)) return fromDfxp(text);
    return fromTimed(text);
}
