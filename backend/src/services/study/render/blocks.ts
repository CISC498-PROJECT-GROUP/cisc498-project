// One study block → its HTML. The look lives in css/blocks.css; colours come from the unit the block
// sits in (the --u, --ut, --us custom properties set on the unit's section).

import type { LeafBlock, StudyBlock, StudyLink, TableData } from '@canvas-assistant/shared';
import { esc, join, PLAY, STAR } from '@/services/study/render/html';
import { inline } from '@/services/study/render/inline';
import { texToMathml } from '@/services/study/render/math';
import { sanitizeSvg } from '@/services/study/render/svg';

export interface BlockContext {
    /** "Barmaki said" or "In lecture" — the label of a quote. */
    saidLabel: (when: string) => string;
    /** A fresh id prefix for a diagram. */
    nextId: () => string;
}

/** "Leila Barmaki" → "Barmaki"; "Barmaki, Leila" → "Barmaki"; '' → ''. */
export const surname = (name: string): string => {
    const plain = name.replace(/\b(dr|prof|professor|mr|mrs|ms|mx)\.?\s+/gi, '').trim();
    if (plain.includes(',')) return plain.split(',')[0]!.trim();
    return plain.split(/\s+/).pop() ?? '';
};

export const saidLabeller =
    (instructor: string) =>
    (when: string): string => {
        const who = surname(instructor);
        const head = who ? `${who} said` : 'In lecture';
        return when.trim() ? `${head} (${when.trim()})` : head;
    };

const label = (text: string, icon = ''): string => (text.trim() || icon ? `<div class="g-label">${icon}${esc(text)}</div>` : '');

const items = (list: string[], ordered = false): string => (list.length === 0 ? '' : `<${ordered ? 'ol' : 'ul'} class="g-list">${list.map((item) => `<li>${inline(item)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);

const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/;

/** Paragraphs split on blank lines. A model sometimes writes a list inside a text field ("- one",
    "1. two"); those lines become a real list rather than a paragraph with dashes in it. */
function paragraphs(text: string, cls = 'g-p'): string {
    let html = '';
    for (const block of text.split(/\n{2,}/).filter((p) => p.trim() !== '')) {
        let prose: string[] = [];
        let list: string[] = [];
        let ordered = false;
        const flush = () => {
            if (prose.length > 0) html += `<p class="${cls}">${inline(prose.join('\n').trim())}</p>`;
            if (list.length > 0) html += items(list, ordered);
            prose = [];
            list = [];
        };
        for (const line of block.split('\n')) {
            if (BULLET.test(line)) {
                if (prose.length > 0) flush();
                if (list.length === 0) ordered = /^\s*\d/.test(line);
                list.push(line.replace(BULLET, ''));
            } else {
                if (list.length > 0) flush();
                prose.push(line);
            }
        }
        flush();
    }
    return html;
}

export function table(data: TableData, extra = ''): string {
    if (data.rows.length === 0) return '';
    const width = Math.max(data.columns.length, ...data.rows.map((row) => row.length));
    // A header shorter than its rows is missing the row-label column, which comes first.
    const columns = data.columns.length > 0 ? [...Array<string>(width - data.columns.length).fill(''), ...data.columns] : [];
    const head = columns.length > 0 ? `<thead><tr>${columns.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>` : '';
    const rows = data.rows.map((row, i) => `<tr${data.highlight.includes(i) ? ' class="g-hl"' : ''}>${Array.from({ length: width }, (_, j) => `<td>${inline(row[j] ?? '')}</td>`).join('')}</tr>`).join('');
    return `<table class="g-table${extra}">${head}<tbody>${rows}</tbody></table>`;
}

const steps = (list: string[]): string => `<ol class="g-steps">${list.map((step, i) => `<li><span class="g-num">${i + 1}</span><div>${inline(step)}</div></li>`).join('')}</ol>`;

function leaf(block: LeafBlock, ctx: BlockContext): string {
    switch (block.type) {
        case 'text':
            return paragraphs(block.text);
        case 'list':
            return items(block.items, block.ordered);
        case 'callout':
            return `<div class="g-box g-box--${block.tone}">${label(block.label)}${paragraphs(block.text, 'g-box-p')}${items(block.items)}</div>`;
        case 'said':
            return `<div class="g-box g-box--said">${label(ctx.saidLabel(block.when), STAR)}<p class="g-quote">“${esc(block.quote.replace(/^["“”]+|["“”]+$/g, ''))}”</p></div>`;
        case 'walkthrough': {
            const side = block.table && block.table.rows.length > 0 ? table(block.table, ' g-table--walk') : '';
            const body = side ? `<div class="g-walk-split"><div>${side}</div><div>${steps(block.steps)}</div></div>` : steps(block.steps);
            const note = block.note.trim() ? `<p class="g-walk-note">${inline(block.note)}</p>` : '';
            const title = block.label.trim() || (block.variant === 'try' ? 'Try it' : 'Walkthrough');
            return `<div class="g-walk${block.variant === 'try' ? ' g-walk--try' : ''}">${label(title)}${block.prompt.trim() ? `<div class="g-walk-prompt">${inline(block.prompt)}</div>` : ''}${body}${note}</div>`;
        }
        case 'table': {
            const html = table(block);
            return html && `<div class="g-tablewrap">${html}${block.caption.trim() ? `<p class="g-cap">${inline(block.caption)}</p>` : ''}</div>`;
        }
        case 'formula': {
            if (block.lines.length === 0) return '';
            const lines = block.lines.map((line) => `<div class="g-math">${texToMathml(line, true)}</div>`).join('');
            return `<div class="g-formula">${label(block.label)}${lines}${block.note.trim() ? `<p class="g-formula-note">${inline(block.note)}</p>` : ''}</div>`;
        }
        case 'diagram': {
            const svg = sanitizeSvg(block.svg, ctx.nextId());
            return svg && `<figure class="g-fig">${svg}${block.caption.trim() ? `<figcaption>${inline(block.caption)}</figcaption>` : ''}</figure>`;
        }
        case 'cards':
            return block.items.length === 0 ? '' : `<div class="g-cards g-cards--${block.items.length}">${block.items.map((card) => `<div class="g-card">${label(card.label)}<p>${inline(card.text)}</p></div>`).join('')}</div>`;
    }
}

export function renderBlock(block: StudyBlock, ctx: BlockContext): string {
    if (block.type !== 'columns') return leaf(block, ctx);
    const side = (list: LeafBlock[]) => list.map((b) => leaf(b, ctx)).join('');
    const left = side(block.left);
    const right = side(block.right);
    if (!left || !right) return left || right;
    return `<div class="g-cols"><div class="g-col">${left}</div><div class="g-col">${right}</div></div>`;
}

/** The "WATCH" row of video chips under a section. */
export const watchRow = (links: StudyLink[]): string =>
    links.length === 0 ? '' : `<div class="g-watch"><span class="g-watch-label">Watch</span>${links.map((l) => `<a class="g-chip${l.posted ? ' g-chip--gold' : ''}" href="${esc(l.url)}">${PLAY}${esc(l.title)}</a>`).join('')}</div>`;

export const sectionHeading = (number: string, title: string): string => `<h3 class="g-h">${join(`<span class="g-badge">${esc(number)}</span>`)}<span>${esc(title)}</span></h3>`;
