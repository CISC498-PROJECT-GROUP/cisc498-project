// Coercion for the larger study shapes — a plan, a section's blocks, a whole document — on the same
// terms as coerce.ts: shaped, capped, unknown items dropped. Blocks arrive two ways: typed, from the
// extension (a document to render), and flat, from the model (every field on every block — see
// section-prompt.ts); both come out typed.

import type { LeafBlock, PlanUnit, SaidQuote, StudyBlock, StudyLink, StudyPlan, StudySection, TableData } from '@canvas-assistant/shared';
import { isObject, list, obj, str, strs, type Raw } from '@/services/study/coerce';

const said = (o: Raw): SaidQuote | null => (str(o.quote) === '' ? null : { when: str(o.when, 40), quote: str(o.quote, 1000) });

const unit = (o: Raw): PlanUnit | null => {
    const sections = list(o.sections, (s) => ({ number: str(s.number, 20), title: str(s.title, 200), focus: str(s.focus), points: strs(s.points, 12, 300), lecture_ids: strs(s.lecture_ids, 40, 100) }), 12);
    return sections.length === 0 ? null : { number: str(o.number, 20), title: str(o.title, 200), tagline: str(o.tagline, 300), lecture_ids: strs(o.lecture_ids, 40, 100), sections };
};

export const plan = (value: unknown): StudyPlan => {
    const o = obj(value);
    const overview = isObject(o.overview) ? o.overview : null;
    const cheat = isObject(o.cheat) ? o.cheat : null;
    return {
        title: str(o.title, 200),
        subtitle: str(o.subtitle, 1000),
        chips: strs(o.chips, 4, 120),
        units: list(o.units, unit, 8),
        overview: overview && {
            scope: str(overview.scope, 1000),
            said: list(overview.said, said, 4),
            rules: strs(overview.rules, 12, 300),
            priorities: list(overview.priorities, (p) => ({ what: str(p.what, 200), words: str(p.words, 500) }), 10),
            not_tested: strs(overview.not_tested, 12, 300),
            maybe_not: str(overview.maybe_not, 600),
        },
        cheat: cheat && {
            title: str(cheat.title, 120),
            subtitle: str(cheat.subtitle, 300),
            tables: list(cheat.tables, (t) => ({ unit: str(t.unit, 120), rows: list(t.rows, (r) => ({ name: str(r.name, 200), value: str(r.value, 500) }), 20) }), 8),
            traps: strs(cheat.traps, 14, 300),
            advice: isObject(cheat.advice) ? said(cheat.advice) : null,
            plan: strs(cheat.plan, 8, 300),
        },
    };
};

const table = (o: Raw): TableData => ({
    columns: strs(o.columns, 8, 200),
    rows: Array.isArray(o.rows) ? o.rows.slice(0, 30).map((row) => (Array.isArray(row) ? row.slice(0, 8).map((cell) => str(cell, 500)) : [])) : [],
    highlight: Array.isArray(o.highlight) ? o.highlight.filter((n): n is number => Number.isInteger(n)).slice(0, 30) : [],
});

const leaf = (o: Raw): LeafBlock | null => {
    switch (o.type) {
        // A block with nothing to show is dropped rather than drawn as an empty box.
        case 'text':
            return str(o.text).trim() === '' ? null : { type: 'text', text: str(o.text) };
        case 'list':
            return strs(o.items).length === 0 ? null : { type: 'list', ordered: o.ordered === true, items: strs(o.items, 20, 1000) };
        case 'callout':
            if (str(o.text).trim() === '' && strs(o.items).length === 0) return null;
            return { type: 'callout', tone: o.tone === 'trap' || o.tone === 'note' ? o.tone : 'idea', label: str(o.label, 120), text: str(o.text), items: strs(o.items, 20, 1000) };
        case 'said':
            return str(o.quote) === '' ? null : { type: 'said', when: str(o.when, 40), quote: str(o.quote, 1000) };
        case 'walkthrough':
            // A typed block nests its table; the model's flat block carries columns/rows at the top.
            return {
                type: 'walkthrough',
                variant: o.variant === 'try' ? 'try' : 'walkthrough',
                label: str(o.label, 200),
                prompt: str(o.prompt, 1000),
                table: isObject(o.table) ? table(o.table) : Array.isArray(o.rows) && o.rows.length > 0 ? table(o) : null,
                steps: strs(o.steps, 10, 1500),
                note: str(o.note, 1000),
            };
        case 'table':
            return { type: 'table', ...table(o), caption: str(o.caption, 500) };
        case 'formula':
            return { type: 'formula', label: str(o.label, 120), lines: strs(o.lines, 8, 1000), note: str(o.note, 1000) };
        case 'diagram':
            return { type: 'diagram', svg: str(o.svg, 40000), caption: str(o.caption, 500) };
        case 'cards':
            return { type: 'cards', items: list(Array.isArray(o.cards) ? o.cards : o.items, (i) => ({ label: str(i.label, 120), text: str(i.text, 1000) }), 4) };
        default:
            return null;
    }
};

export const blocks = (value: unknown): StudyBlock[] => list(value, (o): StudyBlock | null => (o.type === 'columns' ? { type: 'columns', left: list(o.left, leaf, 10), right: list(o.right, leaf, 10) } : leaf(o)), 20);

export const section = (o: Raw): StudySection | null => (str(o.number) === '' ? null : { number: str(o.number, 20), title: str(o.title, 200), blocks: blocks(o.blocks) });

export const links = (o: Raw): { number: string; links: StudyLink[] } => ({
    number: str(o.number, 20),
    links: list(o.links, (l) => (/^https:\/\//.test(str(l.url)) ? { title: str(l.title, 120), url: str(l.url, 500), posted: l.posted === true } : null), 4),
});
