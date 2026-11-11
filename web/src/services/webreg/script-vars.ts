// Reading `var name = …;` out of WebReg's inline scripts without running them. WebReg's schedule page
// carries its data as script variables (var schedule = [...], var term = {...}, var maxCredits = 18);
// this finds the declaration, takes the value literal — balanced brackets for an object or array,
// up to the `;` otherwise — and parses it as JSON. Never eval: the page is someone else's code.
//
// Pure, so it tests on plain strings.

/** The end of the bracketed literal starting at `start` (an index just past its closing bracket), or -1. */
function balancedEnd(text: string, start: number): number {
    let depth = 0;
    let quote: string | null = null;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (quote) {
            if (ch === '\\') i++;
            else if (ch === quote) quote = null;
            continue;
        }
        if (ch === '"' || ch === "'") quote = ch;
        else if (ch === '{' || ch === '[') depth++;
        else if (ch === '}' || ch === ']') {
            depth--;
            if (depth === 0) return i + 1;
        }
    }
    return -1;
}

/** The literal text assigned to `name`, or null when the script doesn't declare it. */
export function varLiteral(script: string, name: string): string | null {
    const match = new RegExp(`(?:^|[;\\s])(?:var|let|const)\\s+${name}\\s*=\\s*`).exec(script);
    if (!match) return null;
    const start = match.index + match[0].length;
    const first = script[start];
    if (first === '{' || first === '[') {
        const end = balancedEnd(script, start);
        return end === -1 ? null : script.slice(start, end);
    }
    const end = script.slice(start).search(/[;\n]/);
    return (end === -1 ? script.slice(start) : script.slice(start, start + end)).trim();
}

/** A JS literal as a value: JSON, or a single-quoted string. Undefined when it isn't plain data. */
export function parseLiteral(literal: string): unknown {
    try {
        return JSON.parse(literal);
    } catch {
        const single = /^'((?:[^'\\]|\\.)*)'$/.exec(literal);
        if (single) return single[1].replace(/\\(.)/g, '$1');
        return undefined;
    }
}

/** The value of `var name` across a page's scripts — the first declaration found. */
export function readVar(scripts: string[], name: string): unknown {
    for (const script of scripts) {
        const literal = varLiteral(script, name);
        if (literal !== null) return parseLiteral(literal);
    }
    return undefined;
}
