// A StudyDocument → one self-contained HTML page, ready to print: fonts embedded, styles inline, no
// script and nothing to fetch. US Letter, with the course and title in the footer's left corner and
// "page / pages" in its right.
//
// A study guide is cover → exam at a glance → one part per unit → review sheet. A topics PDF is
// cover → every unit's topics, flowing → the list of lectures it was built from.

import type { StudyDocument } from '@canvas-assistant/shared';
import base from '@/services/study/render/css/base.css' with { type: 'text' };
import blocks from '@/services/study/render/css/blocks.css' with { type: 'text' };
import callouts from '@/services/study/render/css/callouts.css' with { type: 'text' };
import coverCss from '@/services/study/render/css/cover.css' with { type: 'text' };
import pages from '@/services/study/render/css/pages.css' with { type: 'text' };
import { table } from '@/services/study/render/blocks';
import { cheat, sources } from '@/services/study/render/cheat';
import { docContext, type DocContext } from '@/services/study/render/context';
import { cover } from '@/services/study/render/cover';
import { fontFaces } from '@/services/study/render/fonts';
import { cssString, esc, shortDate } from '@/services/study/render/html';
import { overview } from '@/services/study/render/overview';
import { guideUnit, topicsUnit } from '@/services/study/render/units';

const CSS = [base, coverCss, callouts, blocks, pages].join('\n');

/** The one-line title: the cover's line break becomes a space. */
export const flatTitle = (doc: StudyDocument): string => doc.plan.title.replace(/\s*\n\s*/g, ' ').trim() || 'Study Guide';

const pageRule = (footer: string): string =>
    `@page{size:letter;margin:0.55in 0.6in 0.62in;` +
    `@bottom-left{content:${cssString(footer)};font:400 7.5pt Inter,sans-serif;color:#868e96;vertical-align:top;padding-top:0.16in}` +
    `@bottom-right{content:counter(page) " / " counter(pages);font:400 7.5pt Inter,sans-serif;color:#868e96;vertical-align:top;padding-top:0.16in}}`;

function lectureIndex(ctx: DocContext): string {
    const lectures = [...ctx.doc.lectures].sort((a, b) => a.date.localeCompare(b.date));
    const rows = lectures.map((l) => [shortDate(l.date), l.title, l.minutes ? `${l.minutes} min` : '']);
    return `<section class="g-unit g-unit--flow" style="--u:#1e2a5a;--ut:#eef1f8;--us:#d5dbea"><h3 class="g-h4">Lectures covered</h3>${table({ columns: ['Date', 'Lecture', 'Length'], rows, highlight: [] })}</section>`;
}

export function renderHtml(doc: StudyDocument): string {
    const ctx = docContext(doc);
    const title = flatTitle(doc);
    const units = doc.plan.units;
    const body =
        doc.kind === 'topics'
            ? cover(ctx).replace('class="g-cover"', 'class="g-cover g-cover--flow"') + units.map((unit, i) => topicsUnit(ctx, unit, i)).join('') + lectureIndex(ctx) + sources(ctx)
            : cover(ctx) + overview(ctx) + units.map((unit, i) => guideUnit(ctx, unit, i)).join('') + cheat(ctx);
    const footer = [doc.course.code, title].filter(Boolean).join(' ');
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${fontFaces()}\n${pageRule(footer)}\n${CSS}</style></head><body>${body}</body></html>`;
}
