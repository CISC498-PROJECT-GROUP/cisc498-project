// The cover: the gradient hero (course line, title, what's inside, exam facts as pills), a card per
// unit in its colour, and — for a study guide — the "How to read this guide" key to the boxes.

import { inline } from '@/services/study/render/inline';
import { esc, PLAY, STAR } from '@/services/study/render/html';
import { themeStyle, type DocContext } from '@/services/study/render/context';
import { unitTheme } from '@/services/study/render/theme';

function hero(ctx: DocContext): string {
    const { course, plan } = ctx.doc;
    const eyebrow = [course.code, course.name, course.instructor].filter((part) => part.trim() !== '').join(' · ');
    const title = plan.title
        .split('\n')
        .map((line) => esc(line.trim()))
        .join('<br>');
    const chips = plan.chips.map((chip) => `<span class="g-pill">${esc(chip)}</span>`).join('');
    return `<div class="g-hero">${eyebrow ? `<div class="g-eyebrow">${esc(eyebrow)}</div>` : ''}<h1 class="g-title">${title}</h1>${plan.subtitle ? `<p class="g-hero-sub">${inline(plan.subtitle)}</p>` : ''}${chips ? `<div class="g-pills">${chips}</div>` : ''}</div>`;
}

export function unitCards(ctx: DocContext): string {
    const cards = ctx.doc.plan.units.map(
        (unit, i) => `<div class="g-ucard" style="${themeStyle(unitTheme(i))}"><div class="g-ucard-n">${esc(unit.number)}</div><div class="g-ucard-t">${esc(unit.title)}</div><div class="g-ucard-s">${esc(unit.tagline)}</div></div>`,
    );
    return `<div class="g-ucards g-ucards--${Math.min(cards.length, 4)}">${cards.join('')}</div>`;
}

function legend(ctx: DocContext): string {
    const who = ctx.who ? `${ctx.who} said` : 'In lecture';
    const hasLinks = ctx.doc.links.some((entry) => entry.links.length > 0);
    const gold = ctx.doc.links.some((entry) => entry.links.some((link) => link.posted));
    const chips = hasLinks ? `<p class="g-small">${PLAY} chips are YouTube links (clickable in the PDF).${gold ? ' Gold chips are videos the course itself links to.' : ''}</p>` : '';
    return `<div class="g-legend"><h3 class="g-legend-h">How to read this guide</h3><div class="g-legend-grid">
<div class="g-box g-box--idea g-box--key"><strong>The idea</strong>: the concept in plain words. Read this first.</div>
<div class="g-walk g-box--key"><strong>Walkthrough</strong>: a worked problem, step by step. Cover the steps and try it first.</div>
<div class="g-box g-box--said g-box--key"><strong>${STAR} ${esc(who)}</strong>: the instructor's own words from the recorded lectures about what matters.</div>
<div class="g-box g-box--trap g-box--key"><strong>Trap</strong>: mistakes the instructor warned about, or made and corrected in class.</div>
</div>${chips}</div>`;
}

export function cover(ctx: DocContext, extra = ''): string {
    const { doc } = ctx;
    const note = `Built from ${doc.lectures.length} recorded ${doc.lectures.length === 1 ? 'lecture' : 'lectures'} in the course's Media Gallery.`;
    const key = doc.kind === 'study_guide' ? legend(ctx) : extra;
    return `<section class="g-cover"><div>${hero(ctx)}</div><div class="g-cover-mid">${unitCards(ctx)}<p class="g-small">${esc(note)}</p></div><div class="g-cover-end">${key}</div></section>`;
}
