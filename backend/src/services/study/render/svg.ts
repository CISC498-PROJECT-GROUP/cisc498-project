// Diagram SVG comes from the model, so it is rebuilt from an allowlist before it reaches the page:
// drawing elements and presentation attributes only. No script, style, link, image or foreign
// content survives, and every id is prefixed so two diagrams' markers can't collide. (The page is
// also printed with every network request refused — this is the first line, not the only.)

const ELEMENTS = new Set(['svg', 'g', 'defs', 'marker', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path', 'text', 'tspan', 'title']);

/** Elements whose content goes with them. */
const DROP_WITH_CONTENT = new Set(['script', 'style', 'foreignobject', 'image', 'iframe', 'a', 'use', 'animate', 'set']);

const ATTRIBUTES = new Set([
    'viewbox',
    'xmlns',
    'preserveaspectratio',
    'x',
    'y',
    'x1',
    'y1',
    'x2',
    'y2',
    'cx',
    'cy',
    'r',
    'rx',
    'ry',
    'width',
    'height',
    'd',
    'points',
    'dx',
    'dy',
    'transform',
    'id',
    'fill',
    'fill-opacity',
    'stroke',
    'stroke-width',
    'stroke-opacity',
    'stroke-dasharray',
    'stroke-linecap',
    'stroke-linejoin',
    'opacity',
    'font-size',
    'font-weight',
    'font-style',
    'text-anchor',
    'dominant-baseline',
    'letter-spacing',
    'marker-end',
    'marker-start',
    'marker-mid',
    'markerwidth',
    'markerheight',
    'refx',
    'refy',
    'orient',
    'markerunits',
]);

/** SVG attribute names are case-sensitive; the allowlist above is matched lower-cased. */
const CASED: Record<string, string> = { viewbox: 'viewBox', preserveaspectratio: 'preserveAspectRatio', markerwidth: 'markerWidth', markerheight: 'markerHeight', refx: 'refX', refy: 'refY', markerunits: 'markerUnits' };

const safeValue = (value: string): boolean => !/[<>]|javascript:|data:|@import|expression\(/i.test(value) && !/url\((?!\s*#[\w-]+\s*\))/i.test(value);

/** A model writing SVG inside JSON sometimes leaves a character escaped (a literal backslash-u00d7 for ×); decode it. */
const unescapeUnicode = (text: string): string => text.replace(/\x5cu([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));

const escapeText = (text: string): string =>
    unescapeUnicode(text)
        .replace(/&(?!(?:[a-z]+|#\d+|#x[\da-f]+);)/gi, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

function attributes(raw: string, element: string, prefix: string): string {
    const out: string[] = [];
    for (const match of raw.matchAll(/([a-zA-Z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/g)) {
        const name = match[1]!.toLowerCase();
        let value = match[3] ?? match[4] ?? '';
        if (!ATTRIBUTES.has(name) || !safeValue(value)) continue;
        // The page sizes the diagram; a fixed size on the root would fight the layout.
        if (element === 'svg' && (name === 'width' || name === 'height')) continue;
        if (name === 'id') value = `${prefix}-${value}`;
        value = value.replace(/url\(\s*#([\w-]+)\s*\)/g, `url(#${prefix}-$1)`);
        out.push(`${CASED[name] ?? name}="${value.replace(/&(?!(?:[a-z]+|#\d+|#x[\da-f]+);)/gi, '&amp;')}"`);
    }
    return out.length > 0 ? ` ${out.join(' ')}` : '';
}

/** The SVG rebuilt from the allowlist, or '' when it isn't an SVG. */
export function sanitizeSvg(svg: string, prefix: string): string {
    const source = svg.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>/gi, '');
    if (!/^\s*<svg[\s>]/i.test(source)) return '';

    let out = '';
    let skipping: string | null = null;
    const open: string[] = [];
    for (const part of source.split(/(<[^>]*>)/)) {
        const tag = /^<\s*(\/?)\s*([a-zA-Z][\w:-]*)([\s\S]*?)(\/?)\s*>$/.exec(part);
        if (!tag) {
            if (!part.startsWith('<') && skipping === null && open.length > 0) out += escapeText(part);
            continue;
        }
        const [, closing, rawName, rest, selfClosing] = tag;
        const name = rawName!.toLowerCase();
        if (skipping !== null) {
            if (closing && name === skipping) skipping = null;
            continue;
        }
        if (DROP_WITH_CONTENT.has(name)) {
            if (!closing && !selfClosing) skipping = name;
            continue;
        }
        if (!ELEMENTS.has(name)) continue;
        if (closing) {
            // Close back to the matching element; a stray closing tag is dropped.
            if (!open.includes(name)) continue;
            while (open.length > 0) {
                const top = open.pop()!;
                out += `</${top}>`;
                if (top === name) break;
            }
            if (open.length === 0) break;
        } else if (open.length > 0 || name === 'svg') {
            out += `<${name}${attributes(rest ?? '', name, prefix)}${selfClosing ? '/>' : '>'}`;
            if (!selfClosing) open.push(name);
        }
    }
    while (open.length > 0) out += `</${open.pop()}>`;
    return out.includes('viewBox') ? out : '';
}
