// "The exam at a glance": scope, what the instructor said about the exam, the rules, the top
// priorities, a timeline of the lectures coloured by unit, and what is (probably) not tested. Page 0
// of a study guide, in navy.

import type { LectureRef } from '@canvas-assistant/shared';
import { renderBlock, table } from '@/services/study/render/blocks';
import { themeStyle, type DocContext } from '@/services/study/render/context';
import { esc, shortDate } from '@/services/study/render/html';
import { inline } from '@/services/study/render/inline';
import { NAVY, unitTheme } from '@/services/study/render/theme';

export const band = (title: string, sub: string, number: string, chip = ''): string =>
    `<header class="g-band"><div class="g-band-text"><h2 class="g-band-title">${esc(title)}</h2>${sub ? `<p class="g-band-sub">${inline(sub)}</p>` : ''}${chip ? `<span class="g-band-chip">${esc(chip)}</span>` : ''}</div><div class="g-band-n">${number}</div></header>`;

/** Lectures as equal slots; each unit a coloured bar across its lectures; dates above, titles below. */
export function timeline(ctx: DocContext): string {
    const lectures = [...ctx.doc.lectures].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    if (lectures.length === 0) return '';
    const slot = new Map(lectures.map((lecture, i) => [lecture.id, i + 1]));
    const columns = `grid-template-columns:repeat(${lectures.length},1fr)`;
    const segments = ctx.doc.plan.units
        .map((unit, i) => {
            const slots = unit.lecture_ids.map((id) => slot.get(id)).filter((n): n is number => n !== undefined);
            if (slots.length === 0) return '';
            const from = Math.min(...slots);
            const to = Math.max(...slots);
            return `<div class="g-tl-seg" style="grid-column:${from} / ${to + 1};${themeStyle(unitTheme(i))}"><span>${esc(`${unit.number} · ${unit.title}`)}</span></div>`;
        })
        .join('');
    const cell = (lecture: LectureRef, i: number, text: string) => `<div class="g-tl-cell${i % 2 ? ' g-tl-cell--low' : ''}">${esc(text)}</div>`;
    const short = (title: string) => (title.length > 34 ? `${title.slice(0, 32).trimEnd()}…` : title);
    return `<div class="g-tl">
<div class="g-tl-row" style="${columns}">${lectures.map((l, i) => `<div class="g-tl-date">${esc(i > 0 && lectures[i - 1]!.date === l.date ? '' : shortDate(l.date))}</div>`).join('')}</div>
<div class="g-tl-row g-tl-bar" style="${columns}">${segments}</div>
<div class="g-tl-row" style="${columns}">${lectures.map((l, i) => cell(l, i, short(l.title))).join('')}</div>
</div>`;
}

export function overview(ctx: DocContext): string {
    const page = ctx.doc.plan.overview;
    if (!page) return '';
    const who = ctx.who || 'the instructor';
    const said = page.said.map((quote) => renderBlock({ type: 'said', when: quote.when, quote: quote.quote }, ctx)).join('');
    const rules = page.rules.length > 0 ? `<h3 class="g-h4">Rules</h3><ul class="g-list">${page.rules.map((rule) => `<li>${inline(rule)}</li>`).join('')}</ul>` : '';
    const priorities =
        page.priorities.length > 0
            ? `<h3 class="g-h4">${esc(ctx.who ? `${ctx.who}'s top priorities` : 'Top priorities')}</h3>${table({ columns: ['What', 'In lecture'], rows: page.priorities.map((p) => [p.what, p.words]), highlight: [] }, ' g-table--prio')}`
            : '';
    const notTested = page.not_tested.length > 0 ? renderBlock({ type: 'callout', tone: 'trap', label: `Not on the exam (${who} said so or skipped it)`, text: '', items: page.not_tested }, ctx) : '';
    const maybe = page.maybe_not ? renderBlock({ type: 'callout', tone: 'note', label: 'Probably not tested', text: page.maybe_not, items: [] }, ctx) : '';
    const sub = `What's on it, how it's graded, and what ${who} stressed — from the recorded lectures${ctx.doc.plan.chips.length > 0 ? ' and Canvas' : ''}.`;
    const lower = notTested && maybe ? `<div class="g-cols">${`<div class="g-col">${notTested}</div><div class="g-col">${maybe}</div>`}</div>` : notTested || maybe;

    return `<section class="g-unit g-unit--first" style="${themeStyle(NAVY)}">${band('The exam at a glance', sub, '0')}
<div class="g-cols g-cols--overview"><div class="g-col"><h3 class="g-h4">Scope</h3><p class="g-p">${inline(page.scope)}</p>${said}${rules}</div><div class="g-col">${priorities}</div></div>
<h3 class="g-h4">Lecture timeline</h3>${timeline(ctx)}${lower}</section>`;
}
