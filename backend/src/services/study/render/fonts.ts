// The guide's typefaces, embedded in the printed page as data URLs so a PDF looks the same on any
// machine that prints it: Inter for text, STIX Two Text for formulas, JetBrains Mono for code. The
// files come from the @fontsource packages, read once and kept.
//
// Display math (MathML) needs a font with an OpenType MATH table for stretchy symbols, and the
// @fontsource math face is a Latin-only subset — so formulas fall back to the system's math font:
// Cambria Math on Windows, Latin Modern Math in the Docker image (fonts-lmodern).

import { readFileSync } from 'node:fs';

interface Face {
    family: string;
    file: string;
    weight: string;
    style: 'normal' | 'italic';
    range: string;
}

const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
const GREEK = 'U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF';

const FACES: Face[] = [
    { family: 'Inter', file: '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', weight: '100 900', style: 'normal', range: LATIN },
    { family: 'Inter', file: '@fontsource-variable/inter/files/inter-latin-wght-italic.woff2', weight: '100 900', style: 'italic', range: LATIN },
    { family: 'Inter', file: '@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2', weight: '100 900', style: 'normal', range: LATIN_EXT },
    { family: 'Inter', file: '@fontsource-variable/inter/files/inter-greek-wght-normal.woff2', weight: '100 900', style: 'normal', range: GREEK },
    { family: 'STIX Two Text', file: '@fontsource/stix-two-text/files/stix-two-text-latin-400-normal.woff2', weight: '400', style: 'normal', range: LATIN },
    { family: 'STIX Two Text', file: '@fontsource/stix-two-text/files/stix-two-text-latin-400-italic.woff2', weight: '400', style: 'italic', range: LATIN },
    { family: 'STIX Two Text', file: '@fontsource/stix-two-text/files/stix-two-text-latin-700-normal.woff2', weight: '700', style: 'normal', range: LATIN },
    { family: 'STIX Two Text', file: '@fontsource/stix-two-text/files/stix-two-text-greek-400-normal.woff2', weight: '400', style: 'normal', range: GREEK },
    { family: 'JetBrains Mono', file: '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2', weight: '100 800', style: 'normal', range: LATIN },
];

let css: string | null = null;

const face = (f: Face): string => {
    const data = readFileSync(Bun.resolveSync(f.file, import.meta.dir)).toString('base64');
    return `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};font-display:block;src:url(data:font/woff2;base64,${data}) format('woff2');unicode-range:${f.range}}`;
};

/** The @font-face rules, built on first use. */
export function fontFaces(): string {
    css ??= FACES.map(face).join('\n');
    return css;
}
