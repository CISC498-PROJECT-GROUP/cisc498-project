/* The building blocks of a study-guide section, one per visual element of the guide's design. The
   model writes a section as a list of these; the backend's renderer owns how each one looks, so a
   guide's design never depends on what the model chose to format.

   Text fields take a small inline markup — **bold**, *italic*, `code`, ==answer== (the green answer
   chip) and $tex$ (inline math) — and formula lines take a TeX subset. Blocks do not nest except
   that `columns` holds two lists of the others: structured outputs cannot express a recursive
   schema, and the design never goes deeper. */

export interface TextBlock {
    type: 'text';
    text: string;
}

export interface ListBlock {
    type: 'list';
    ordered: boolean;
    items: string[];
}

/** A tinted box with a small capitalised label. idea: the unit's colour ("THE IDEA", a theorem);
    trap: red (a mistake to avoid, what is NOT on the exam); note: grey (an aside). */
export interface CalloutBlock {
    type: 'callout';
    tone: 'idea' | 'trap' | 'note';
    label: string;
    text: string;
    items: string[];
}

/** The instructor's own words, verbatim from a lecture — gold, starred. */
export interface SaidBlock {
    type: 'said';
    /** When it was said, "Oct 7", or ''. */
    when: string;
    quote: string;
}

export interface TableData {
    columns: string[];
    rows: string[][];
    /** Zero-based rows to tint. */
    highlight: number[];
}

/** A worked problem: the setup in bold, then numbered steps whose results are ==answers==. `try`
    is the same, framed as one to attempt first. A table, when present, sits beside the steps. */
export interface WalkthroughBlock {
    type: 'walkthrough';
    variant: 'walkthrough' | 'try';
    label: string;
    prompt: string;
    table: TableData | null;
    steps: string[];
    note: string;
}

export interface TableBlock extends TableData {
    type: 'table';
    caption: string;
}

/** A formula box: a small label, display-math lines in TeX, an optional note under it. */
export interface FormulaBlock {
    type: 'formula';
    label: string;
    lines: string[];
    note: string;
}

/** An explanatory drawing as inline SVG, captioned. */
export interface DiagramBlock {
    type: 'diagram';
    svg: string;
    caption: string;
}

/** Two to four small tinted cards side by side — a label and a line or two each. */
export interface CardsBlock {
    type: 'cards';
    items: { label: string; text: string }[];
}

export type LeafBlock = TextBlock | ListBlock | CalloutBlock | SaidBlock | WalkthroughBlock | TableBlock | FormulaBlock | DiagramBlock | CardsBlock;

export interface ColumnsBlock {
    type: 'columns';
    left: LeafBlock[];
    right: LeafBlock[];
}

export type StudyBlock = LeafBlock | ColumnsBlock;

/** One numbered section ("2.3 Central tendency") as written. */
export interface StudySection {
    number: string;
    title: string;
    blocks: StudyBlock[];
}
