/* The study-material contract: recorded lectures in, a structured document out, then a PDF.

   The EXTENSION fetches the transcripts (it holds the student's Canvas and Media Gallery sessions)
   and runs the steps in order; the BACKEND owns the model calls and the PDF renderer and stores
   nothing between requests. Each step is its own short request — one lecture, one section — so none
   outlives the extension worker's per-message limit, and the student sees progress as it goes:

     digest (per lecture) → plan (whole document) → section (per section) + links (per unit) → render

   Every date is a local calendar day, YYYY-MM-DD. Strings the model fills that have nothing to say
   are '' rather than absent — structured outputs keep every field required. */

import type { StudySection } from './study-blocks';

export type StudyKind = 'topics' | 'study_guide';

/** One recording, as the course's Media Gallery lists it. */
export interface LectureRef {
    id: string;
    title: string;
    date: string;
    minutes: number | null;
}

export interface CourseRef {
    code: string;
    name: string;
    /** The instructor's name as Canvas shows it, or '' when the course lists none or several. */
    instructor: string;
}

export interface DigestRequest {
    course: CourseRef;
    lecture: LectureRef;
    transcript: string;
}

export type QuoteKind = 'exam' | 'emphasis' | 'warning' | 'logistics';

/** Something the instructor said, word for word — the backend drops any quote it cannot find in the
    transcript. */
export interface LectureQuote {
    text: string;
    about: string;
    kind: QuoteKind;
}

/** What one lecture covered, in a form small enough to hand a dozen of to one model call. */
export interface LectureDigest {
    lecture: LectureRef;
    summary: string;
    topics: { title: string; points: string[] }[];
    definitions: { term: string; meaning: string }[];
    formulas: { name: string; tex: string; note: string }[];
    examples: { title: string; setup: string; steps: string[]; answer: string }[];
    quotes: LectureQuote[];
    /** What was said about exams: dates, format, rules, scope. */
    exam_notes: string[];
    /** Mistakes the instructor warned about, or made and corrected. */
    traps: string[];
    /** Topics the instructor said are skipped or not tested. */
    skipped: string[];
}

/** The exam a document is for, as the chat found it in Canvas. '' throughout when there is none. */
export interface ExamInfo {
    name: string;
    date: string;
    notes: string;
}

export interface PlanRequest {
    kind: StudyKind;
    course: CourseRef;
    title: string;
    range: { from: string; to: string };
    exam: ExamInfo;
    digests: LectureDigest[];
}

export interface PlanSection {
    number: string;
    title: string;
    /** What the section must cover — the brief its writer works from. */
    focus: string;
    /** The section's topics as short bullets; on their own they make the topics PDF. */
    points: string[];
    lecture_ids: string[];
}

export interface PlanUnit {
    number: string;
    title: string;
    tagline: string;
    lecture_ids: string[];
    sections: PlanSection[];
}

/** A verbatim quote with when it was said ("Oct 7"). */
export interface SaidQuote {
    when: string;
    quote: string;
}

/** The "exam at a glance" page. */
export interface Overview {
    scope: string;
    said: SaidQuote[];
    rules: string[];
    priorities: { what: string; words: string }[];
    not_tested: string[];
    maybe_not: string;
}

/** The closing one-page review sheet. */
export interface CheatSheet {
    title: string;
    subtitle: string;
    tables: { unit: string; rows: { name: string; value: string }[] }[];
    traps: string[];
    advice: SaidQuote | null;
    plan: string[];
}

export interface StudyPlan {
    /** May hold one "\n" where the cover title breaks. */
    title: string;
    subtitle: string;
    chips: string[];
    units: PlanUnit[];
    /** Study guides only. */
    overview: Overview | null;
    cheat: CheatSheet | null;
}

export interface SectionRequest {
    course: CourseRef;
    plan: StudyPlan;
    /** Number of the section to write, e.g. "2.3". */
    section: string;
    /** The digests of the lectures the section draws on. */
    digests: LectureDigest[];
}

/** A link to a video. `posted` marks one the course itself links to (shown in gold). */
export interface StudyLink {
    title: string;
    url: string;
    posted: boolean;
}

export interface LinksRequest {
    course: CourseRef;
    unit: PlanUnit;
    /** Videos the course links to (module items), from Canvas. */
    resources: { title: string; url: string }[];
}

export interface LinksResponse {
    sections: { number: string; links: StudyLink[] }[];
}

/** Everything the renderer needs — the plan, the written sections and the links, as built. */
export interface StudyDocument {
    kind: StudyKind;
    course: CourseRef;
    range: { from: string; to: string };
    /** The day it was made. */
    generated: string;
    lectures: LectureRef[];
    /** Lectures in the range that had no captions, so were left out. */
    missing: LectureRef[];
    plan: StudyPlan;
    sections: StudySection[];
    links: { number: string; links: StudyLink[] }[];
}

export interface RenderResponse {
    /** The PDF, base64. */
    pdf: string;
    pages: number;
    filename: string;
}
