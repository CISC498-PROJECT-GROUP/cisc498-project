// A unit of a study guide: its coloured band (title, tagline, lecture dates, big number), then each
// section — numbered badge heading, its blocks, its WATCH chips. A topics PDF uses the same band with
// each section's topic bullets instead of written content.

import type { PlanUnit } from '@canvas-assistant/shared';
import { renderBlock, sectionHeading, watchRow } from '@/services/study/render/blocks';
import { lectureDates, themeStyle, type DocContext } from '@/services/study/render/context';
import { esc, shortDate } from '@/services/study/render/html';
import { inline } from '@/services/study/render/inline';
import { band } from '@/services/study/render/overview';
import { unitTheme } from '@/services/study/render/theme';

function unitBand(ctx: DocContext, unit: PlanUnit): string {
    return band(unit.title, unit.tagline, esc(unit.number), lectureDates(ctx.lecturesOf(unit)));
}

export function guideUnit(ctx: DocContext, unit: PlanUnit, index: number): string {
    const written = new Map(ctx.doc.sections.map((section) => [section.number, section]));
    const sections = unit.sections
        .map((planned) => {
            const section = written.get(planned.number);
            if (!section || section.blocks.length === 0) return '';
            const body = section.blocks.map((block) => renderBlock(block, ctx)).join('');
            return `<section class="g-sec">${sectionHeading(planned.number, planned.title)}${body}${watchRow(ctx.linksOf(planned.number))}</section>`;
        })
        .join('');
    return sections ? `<section class="g-unit" style="${themeStyle(unitTheme(index))}">${unitBand(ctx, unit)}${sections}</section>` : '';
}

export function topicsUnit(ctx: DocContext, unit: PlanUnit, index: number): string {
    const lectures = new Map(ctx.doc.lectures.map((lecture) => [lecture.id, lecture]));
    const sections = unit.sections
        .map((section) => {
            const from = section.lecture_ids
                .map((id) => lectures.get(id))
                .filter((lecture) => lecture !== undefined)
                .map((lecture) => `${lecture.title} (${shortDate(lecture.date)})`);
            const points = section.points.length > 0 ? `<ul class="g-list">${section.points.map((point) => `<li>${inline(point)}</li>`).join('')}</ul>` : '';
            return `<section class="g-sec g-sec--topics">${sectionHeading(section.number, section.title)}${points}${from.length > 0 ? `<p class="g-from">From ${esc(from.join(' · '))}</p>` : ''}</section>`;
        })
        .join('');
    return `<section class="g-unit g-unit--flow" style="${themeStyle(unitTheme(index))}">${unitBand(ctx, unit)}<div class="g-topics">${sections}</div></section>`;
}
