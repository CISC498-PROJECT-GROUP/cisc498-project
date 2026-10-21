// POST /study/section: one section of a study guide, written from its brief in the plan and the
// digests of its unit's lectures. Sending the whole unit's digests (not just the section's) keeps the
// cached prefix — system, plan outline, digests — identical for every section of a unit.
//
// The model's flat blocks are turned into typed ones, and a "said" block whose quote isn't one of the
// digests' (transcript-checked) quotes is dropped.

import type { LeafBlock, SectionRequest, StudyBlock, StudySection } from '@canvas-assistant/shared';
import { createLogger } from '@/services/common/svc-log';
import { blocks as typedBlocks } from '@/services/study/coerce-doc';
import { unitTheme } from '@/services/study/render/theme';
import { SECTION_SCHEMA, SECTION_SYSTEM } from '@/services/study/section-prompt';
import { StudyRequestError } from '@/services/study/study-errors';
import { cached, plain, structuredCall } from '@/services/study/study-model';
import { digestQuotes, digestsText } from '@/services/study/study-plan';
import { quoteFound } from '@/services/study/study-quotes';

const log = createLogger('study');

/** A callout the model left empty, followed by a text block, means the text was its body. */
function foldEmptyCallouts(blocks: Record<string, unknown>[]): Record<string, unknown>[] {
    const out: Record<string, unknown>[] = [];
    for (const block of blocks) {
        const last = out[out.length - 1];
        const empty = (b: Record<string, unknown> | undefined) => b?.type === 'callout' && !String(b.text ?? '').trim() && !(Array.isArray(b.items) && b.items.length > 0);
        if (empty(last) && block.type === 'text' && last!.column === block.column) out[out.length - 1] = { ...last, text: block.text };
        else out.push(block);
    }
    return out;
}

/** The model's blocks in typed form: each pair of consecutive left/right blocks becomes one columns
    block (a run with only one side stays full-width). */
export function groupColumns(flat: unknown): StudyBlock[] {
    const raw = foldEmptyCallouts(Array.isArray(flat) ? flat.filter((b): b is Record<string, unknown> => typeof b === 'object' && b !== null) : []);
    const grouped: unknown[] = [];
    let run: Record<string, unknown>[] = [];
    const flush = () => {
        const left = run.filter((b) => b.column === 'left');
        const right = run.filter((b) => b.column === 'right');
        if (left.length > 0 && right.length > 0) grouped.push({ type: 'columns', left, right });
        else grouped.push(...run);
        run = [];
    };
    for (const block of raw) {
        // A left block after a right one starts the next pair of columns.
        if (block.column === 'left' && run.some((b) => b.column === 'right')) flush();
        if (block.column === 'left' || block.column === 'right') run.push(block);
        else {
            flush();
            grouped.push(block);
        }
    }
    flush();
    return typedBlocks(grouped);
}

/** Drops unverified quotes, at the top level and inside columns. */
export function keepVerified(blocks: StudyBlock[], source: string): { blocks: StudyBlock[]; dropped: number } {
    let dropped = 0;
    const leaves = (list: LeafBlock[]): LeafBlock[] => list.filter((block) => block.type !== 'said' || quoteFound(block.quote, source) || (dropped++, false));
    const kept = blocks
        .map((block) => (block.type === 'columns' ? { ...block, left: leaves(block.left), right: leaves(block.right) } : block))
        .filter((block) => (block.type === 'columns' ? block.left.length + block.right.length > 0 : leaves([block]).length === 1));
    return { blocks: kept, dropped };
}

export async function writeSection(request: SectionRequest, signal?: AbortSignal): Promise<StudySection> {
    const { plan, digests } = request;
    const unitIndex = plan.units.findIndex((unit) => unit.sections.some((section) => section.number === request.section));
    if (unitIndex === -1) throw new StudyRequestError(`The plan has no section ${request.section}.`);
    const unit = plan.units[unitIndex]!;
    const section = unit.sections.find((s) => s.number === request.section)!;
    const colours = unitTheme(unitIndex);

    const outline = plan.units.map((u) => `${u.number} ${u.title}: ${u.sections.map((s) => `${s.number} ${s.title}`).join('; ')}`).join('\n');
    const lectures = digests.filter((d) => section.lecture_ids.includes(d.lecture.id)).map((d) => `"${d.lecture.title}" (${d.lecture.date})`);
    const brief = [
        `Write section ${section.number} "${section.title}" of unit ${unit.number} "${unit.title}".`,
        `Brief: ${section.focus}`,
        `Covers: ${section.points.join('; ')}`,
        `Draws on: ${lectures.length > 0 ? lectures.join(', ') : 'the unit as a whole'}`,
        `Instructor: ${request.course.instructor || '(not listed)'}`,
        `Unit colour ${colours.main}, its tint ${colours.tint}.`,
    ].join('\n');

    const written = await structuredCall<{ blocks: unknown }>({
        step: 'section',
        system: SECTION_SYSTEM,
        schema: SECTION_SCHEMA,
        effort: 'medium',
        signal,
        content: [cached(`<guide_plan>\n${plan.title.replace(/\n/g, ' ')}\n${outline}\n</guide_plan>`), cached(`<lecture_digests>\n${digestsText(digests)}\n</lecture_digests>`), plain(brief)],
    });

    const { blocks, dropped } = keepVerified(groupColumns(written.blocks), digestQuotes(digests));
    if (dropped > 0) log.info('section quotes dropped', { section: section.number, dropped });
    return { number: section.number, title: section.title, blocks };
}
