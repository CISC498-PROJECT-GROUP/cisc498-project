// POST /study/plan: the document's skeleton from the lecture digests. After the model answers, the
// plan is made consistent — sections renumbered under their unit, lecture ids limited to real ones —
// and every quote it carries is checked against the digests' (already transcript-checked) quotes.

import type { LectureDigest, PlanRequest, PlanUnit, StudyPlan } from '@canvas-assistant/shared';
import { createLogger } from '@/services/common/svc-log';
import { PLAN_SCHEMA, PLAN_SYSTEM } from '@/services/study/plan-prompt';
import { plain, structuredCall } from '@/services/study/study-model';
import { quoteFound, quoteSource, unquote } from '@/services/study/study-quotes';

const log = createLogger('study');

/** The digests as the model reads them: compact JSON, one lecture per line. */
export const digestsText = (digests: LectureDigest[]): string => digests.map((digest) => JSON.stringify(digest)).join('\n');

/** A source to check quotes against: every quote of every digest. */
export const digestQuotes = (digests: LectureDigest[]): string => quoteSource(...digests.flatMap((digest) => digest.quotes.map((quote) => quote.text)));

/** "words" may join fragments of one quote with an ellipsis; every fragment must be found. */
const fragmentsFound = (words: string, source: string): boolean => {
    const fragments = unquote(words)
        .split(/…|\.\.\./)
        .map((fragment) => fragment.trim())
        .filter(Boolean);
    return fragments.length > 0 && fragments.every((fragment) => quoteFound(fragment, source));
};

function tidyUnits(units: PlanUnit[], known: Set<string>): PlanUnit[] {
    const seen = new Set<string>();
    return units
        .filter((unit) => unit.sections.length > 0)
        .map((unit, index) => {
            const number = unit.number.trim() !== '' && !seen.has(unit.number.trim()) ? unit.number.trim() : String(index + 1);
            seen.add(number);
            const ids = (list: string[]) => list.filter((id) => known.has(id));
            return { ...unit, number, lecture_ids: ids(unit.lecture_ids), sections: unit.sections.map((section, i) => ({ ...section, number: `${number}.${i + 1}`, lecture_ids: ids(section.lecture_ids) })) };
        });
}

export async function planDocument(request: PlanRequest, signal?: AbortSignal): Promise<StudyPlan> {
    const { kind, course, title, range, exam, digests } = request;
    const examText = exam.name === '' && exam.date === '' && exam.notes === '' ? 'None given.' : `Name: ${exam.name || '—'}\nWhen: ${exam.date || '—'}\nWhat Canvas says: ${exam.notes || '—'}`;
    const brief = [
        `Kind: ${kind}`,
        `Course: ${course.code} — ${course.name}`,
        `Instructor: ${course.instructor || '(not listed)'}`,
        `The student's title: ${title}`,
        `Lectures from ${range.from} to ${range.to}: ${digests.length}`,
        `Exam info:\n${examText}`,
    ].join('\n');

    const plan = await structuredCall<StudyPlan>({ step: 'plan', system: PLAN_SYSTEM, schema: PLAN_SCHEMA, effort: 'medium', signal, content: [plain(`<lecture_digests>\n${digestsText(digests)}\n</lecture_digests>`), plain(brief)] });

    const units = tidyUnits(plan.units, new Set(digests.map((digest) => digest.lecture.id)));
    if (kind === 'topics') return { ...plan, units, overview: null, cheat: null };

    const source = digestQuotes(digests);
    let dropped = 0;
    const keep = <T>(items: T[], ok: (item: T) => boolean): T[] => items.filter((item) => ok(item) || (dropped++, false));

    const overview = plan.overview && { ...plan.overview, said: keep(plan.overview.said, (said) => quoteFound(said.quote, source)), priorities: keep(plan.overview.priorities, (row) => fragmentsFound(row.words, source)) };
    const advice = plan.cheat?.advice && quoteFound(plan.cheat.advice.quote, source) ? plan.cheat.advice : null;
    if (plan.cheat?.advice && !advice) dropped++;
    const cheat = plan.cheat && { ...plan.cheat, advice };

    if (dropped > 0) log.info('plan quotes dropped', { dropped });
    return { ...plan, units, overview, cheat };
}
