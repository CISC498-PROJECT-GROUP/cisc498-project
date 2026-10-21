// The closing page of a study guide: everything worth memorizing on one sheet — a formula table per
// unit in its colour, the exam-day traps checklist, the instructor's closing advice, a last-night
// plan — and the sources the guide was built from.

import { renderBlock } from '@/services/study/render/blocks';
import { themeStyle, type DocContext } from '@/services/study/render/context';
import { CHECK, esc, longDate, shortDate } from '@/services/study/render/html';
import { inline } from '@/services/study/render/inline';
import { band } from '@/services/study/render/overview';
import { NAVY } from '@/services/study/render/theme';

/** Where the guide came from, honestly: the recordings, their span, what was left out. */
export function sources(ctx: DocContext): string {
    const { doc } = ctx;
    const days = doc.lectures.map((l) => l.date).sort();
    const span = days.length > 0 ? ` (${shortDate(days[0]!)} – ${longDate(days[days.length - 1]!)})` : '';
    const missing = doc.missing.length > 0 ? ` Left out for lack of captions: ${doc.missing.map((l) => `${l.title} (${shortDate(l.date)})`).join(', ')}.` : '';
    const videos = doc.links.some((entry) => entry.links.length > 0) ? ' The videos are third-party, except the gold ones the course links to.' : '';
    const made = doc.generated ? ` Made by Canvas Assistant on ${longDate(doc.generated)}.` : '';
    return `<p class="g-sources">Sources: ${doc.lectures.length} recorded lectures from the ${esc(doc.course.code || 'course')} Media Gallery${esc(span)}, read from their captions${doc.plan.chips.length > 0 ? ', and the exam details posted in Canvas' : ''}.${esc(made + missing + videos)} Check Canvas for official information.</p>`;
}

export function cheat(ctx: DocContext): string {
    const sheet = ctx.doc.plan.cheat;
    if (!sheet) return sources(ctx);

    const tables = sheet.tables
        .filter((t) => t.rows.length > 0)
        .map((t) => {
            const rows = t.rows.map((row) => `<tr><td>${inline(row.name)}</td><td>${inline(row.value)}</td></tr>`).join('');
            return `<table class="g-ktable" style="${themeStyle(ctx.themeFor(t.unit))}"><thead><tr><th colspan="2">${esc(t.unit)}</th></tr></thead><tbody>${rows}</tbody></table>`;
        })
        .join('');
    const traps = sheet.traps.length > 0 ? renderBlock({ type: 'callout', tone: 'trap', label: 'Exam-day traps checklist', text: '', items: sheet.traps }, ctx) : '';
    const who = ctx.who ? `${ctx.who}'s closing advice` : 'Closing advice';
    const advice = sheet.advice ? renderBlock({ type: 'said', when: sheet.advice.when, quote: sheet.advice.quote }, { ...ctx, saidLabel: (when) => (when ? `${who} (${when})` : who) }) : '';
    const plan = sheet.plan.length > 0 ? `<div class="g-box g-box--plan"><div class="g-label">Last-night plan</div><ol class="g-list">${sheet.plan.map((step) => `<li>${inline(step)}</li>`).join('')}</ol></div>` : '';
    const lower = traps && (advice || plan) ? `<div class="g-cols"><div class="g-col">${traps}</div><div class="g-col">${advice}${plan}</div></div>` : traps + advice + plan;

    return `<section class="g-unit g-cheat" style="${themeStyle(NAVY)}">${band(sheet.title || 'One-page review', sheet.subtitle, CHECK)}<div class="g-ktables">${tables}</div>${lower}${sources(ctx)}</section>`;
}
