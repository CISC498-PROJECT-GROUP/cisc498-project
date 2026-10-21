// A small TeX-to-MathML converter for the subset the prompts allow: \frac, \sqrt, ^ and _, big
// operators, accents, \text, Greek letters and the common relation and arrow symbols (the tables are
// in math-symbols.ts). Chrome renders MathML natively, so a formula prints as typeset math without a
// script or a math library.
//
// It never throws: an unknown command prints as its name, and an unbalanced brace closes itself.

import { esc } from '@/services/study/render/html';
import { ACCENTS, BIG, FENCES, FUNCTIONS, IGNORED, LETTERS, OPERATOR_WORDS, SPACES, SYMBOLS, TEXT_COMMANDS } from '@/services/study/render/math-symbols';

/** A command or a character, with where it starts and ends in the source (for \text's raw words). */
type Token = { cmd: string; at: number; end: number } | { ch: string; at: number; end: number };

function tokenize(tex: string): Token[] {
    const tokens: Token[] = [];
    for (let i = 0; i < tex.length; i++) {
        const ch = tex[i]!;
        if (ch !== '\\') {
            if (!/\s/.test(ch)) tokens.push({ ch, at: i, end: i + 1 });
            continue;
        }
        const name = /^[A-Za-z]+/.exec(tex.slice(i + 1))?.[0] ?? tex[i + 1] ?? '';
        tokens.push({ cmd: name, at: i, end: i + 1 + name.length });
        i += name.length;
    }
    return tokens;
}

const charOf = (token: Token | undefined): string | null => (token && 'ch' in token ? token.ch : null);

const text = (words: string, variant: string): string => `<mtext${variant === 'normal' ? '' : ` mathvariant="${variant}"`}>${esc(words).replace(/ /g, '&#160;')}</mtext>`;

class Parser {
    private at = 0;
    /** Set when the atom just read was a function name, which wants a thin space after its scripts. */
    private function = false;

    constructor(
        private readonly tex: string,
        private readonly tokens: Token[],
    ) {}

    row(): string {
        const out: string[] = [];
        while (this.at < this.tokens.length && charOf(this.tokens[this.at]) !== '}') {
            const base = this.atom();
            const isFunction = this.function;
            this.function = false;
            out.push(this.scripts(base) + (isFunction ? '<mspace width="0.17em"/>' : ''));
        }
        return out.join('');
    }

    private is(ch: string): boolean {
        return charOf(this.tokens[this.at]) === ch;
    }

    /** A {group} (or a single atom), as one mrow. */
    private group(): string {
        if (!this.is('{')) return this.atom();
        this.at++;
        const inner = this.row();
        if (this.is('}')) this.at++;
        return `<mrow>${inner}</mrow>`;
    }

    /** The source text of a {group}, spaces kept, for \text and its kin. */
    private rawText(): string {
        if (!this.is('{')) return '';
        const open = this.tokens[this.at++]!;
        let depth = 1;
        while (this.at < this.tokens.length) {
            const ch = charOf(this.tokens[this.at]);
            if (ch === '{') depth++;
            if (ch === '}' && --depth === 0) break;
            this.at++;
        }
        const close = this.tokens[this.at];
        this.at++;
        return this.tex.slice(open.end, close ? close.at : this.tex.length).replace(/\\([{}%#&_$])/g, '$1');
    }

    private scripts(base: string): string {
        let sub: string | null = null;
        let sup: string | null = null;
        while (this.is('_') || this.is('^')) {
            const isSub = this.is('_');
            this.at++;
            if (isSub) sub = this.group();
            else sup = this.group();
        }
        if (base === '') base = '<mrow></mrow>';
        const big = base.includes('largeop');
        if (sub !== null && sup !== null) return big ? `<munderover>${base}${sub}${sup}</munderover>` : `<msubsup>${base}${sub}${sup}</msubsup>`;
        if (sub !== null) return big ? `<munder>${base}${sub}</munder>` : `<msub>${base}${sub}</msub>`;
        if (sup !== null) return big ? `<mover>${base}${sup}</mover>` : `<msup>${base}${sup}</msup>`;
        return base;
    }

    /** A number, with the thousands commas and decimal point inside it ("1,000,000", "0.7"). */
    private number(first: string): string {
        let digits = first;
        for (;;) {
            const ch = charOf(this.tokens[this.at]);
            const next = charOf(this.tokens[this.at + 1]);
            if (ch !== null && /[0-9]/.test(ch)) digits += ch;
            else if ((ch === '.' || ch === ',') && next !== null && /[0-9]/.test(next)) digits += ch;
            else break;
            this.at++;
        }
        return `<mn>${digits}</mn>`;
    }

    private character(ch: string): string {
        if (/[0-9]/.test(ch)) return this.number(ch);
        if (/\p{L}/u.test(ch)) {
            // A run of three or more letters is a word ("freq", "width"), set upright as one name;
            // one or two letters are variables, each in italic.
            let word = ch;
            for (let next = charOf(this.tokens[this.at]); next !== null && /\p{L}/u.test(next); next = charOf(this.tokens[this.at])) {
                word += next;
                this.at++;
            }
            return word.length >= 3 ? `<mi>${esc(word)}</mi>` : [...word].map((letter) => `<mi>${esc(letter)}</mi>`).join('');
        }
        if (ch === '~') return '<mspace width="0.25em"/>';
        if (FENCES.test(ch)) return `<mo stretchy="false">${esc(ch)}</mo>`;
        if (ch === '/') return '<mo lspace="0" rspace="0">/</mo>';
        return `<mo>${esc(ch === '-' ? '−' : ch === '*' ? '∗' : ch)}</mo>`;
    }

    private atom(): string {
        const token = this.tokens[this.at++];
        if (token === undefined) return '';
        if ('ch' in token) {
            if (token.ch !== '{') return this.character(token.ch);
            this.at--;
            return this.group();
        }
        const name = token.cmd;
        if (name === 'frac' || name === 'dfrac' || name === 'tfrac') return `<mfrac>${this.group()}${this.group()}</mfrac>`;
        if (name === 'sqrt') return `<msqrt>${this.group()}</msqrt>`;
        if (name in TEXT_COMMANDS) return text(this.rawText(), TEXT_COMMANDS[name]!);
        if (name === 'pmod') return `<mo stretchy="false">(</mo><mo rspace="0.3em">mod</mo>${this.group()}<mo stretchy="false">)</mo>`;
        if (name in OPERATOR_WORDS) return `<mo lspace="0.3em" rspace="0.3em">${OPERATOR_WORDS[name]}</mo>`;
        if (IGNORED.has(name)) return '';
        if (name in ACCENTS) return `<mover accent="true">${this.group()}<mo>${ACCENTS[name]}</mo></mover>`;
        if (name in SPACES) return `<mspace width="${SPACES[name]}"/>`;
        if (name in BIG) return `<mo largeop="true">${BIG[name]}</mo>`;
        if (name in LETTERS) return `<mi>${LETTERS[name]}</mi>`;
        if (name in SYMBOLS) return `<mo${FENCES.test(SYMBOLS[name]!) ? ' stretchy="false"' : ''}>${esc(SYMBOLS[name]!)}</mo>`;
        if (FUNCTIONS.has(name)) {
            this.function = true;
            return `<mi mathvariant="normal">${name}</mi>`;
        }
        return `<mtext>${esc(name)}</mtext>`;
    }

    /** Whatever is left after a stray "}" — parsed rather than dropped. */
    rest(): string {
        let out = '';
        while (this.at < this.tokens.length) {
            if (this.is('}')) this.at++;
            out += this.row();
        }
        return out;
    }
}

/** MathML for one formula. `display` sets it on its own line, centred, with big operators. */
export function texToMathml(tex: string, display = false): string {
    const parser = new Parser(tex, tokenize(tex));
    const body = parser.row() + parser.rest();
    return `<math${display ? ' display="block"' : ''}><mrow>${body}</mrow></math>`;
}
