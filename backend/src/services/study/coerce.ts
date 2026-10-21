// Coercion for the study requests' bodies. Most of what arrives was written by the model one step
// earlier and carried by the extension, so it is shaped rather than rejected: a missing string is
// '', a missing list is [], an unknown item is dropped. Lengths are capped so one oversized field
// can't balloon a prompt or a page. The validators (study-validate.ts) then insist on what a step
// cannot work without.

import type { CourseRef, LectureDigest, LectureRef, QuoteKind } from '@canvas-assistant/shared';

export type Raw = Record<string, unknown>;

export const isObject = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value);

export const obj = (value: unknown): Raw => (isObject(value) ? value : {});

export const str = (value: unknown, max = 4000): string => (typeof value === 'string' ? value.slice(0, max) : typeof value === 'number' ? String(value) : '');

export const strs = (value: unknown, max = 60, each = 4000): string[] =>
    Array.isArray(value)
        ? value
              .map((item) => str(item, each))
              .filter((item) => item.trim() !== '')
              .slice(0, max)
        : [];

export const list = <T>(value: unknown, each: (item: Raw) => T | null, max = 200): T[] =>
    Array.isArray(value)
        ? value
              .filter(isObject)
              .map(each)
              .filter((item): item is T => item !== null)
              .slice(0, max)
        : [];

export const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const day = (value: unknown): string => {
    const text = str(value, 10);
    return DAY.test(text) ? text : '';
};

export const course = (value: unknown): CourseRef => {
    const o = obj(value);
    return { code: str(o.code, 120), name: str(o.name, 300), instructor: str(o.instructor, 200) };
};

export const lecture = (value: unknown): LectureRef | null => {
    const o = obj(value);
    const id = str(o.id, 100);
    const minutes = typeof o.minutes === 'number' && Number.isFinite(o.minutes) ? Math.round(o.minutes) : null;
    return id === '' ? null : { id, title: str(o.title, 300) || 'Untitled lecture', date: day(o.date), minutes };
};

const QUOTE_KINDS: QuoteKind[] = ['exam', 'emphasis', 'warning', 'logistics'];

export const digest = (value: Raw): LectureDigest | null => {
    const ref = lecture(value.lecture);
    if (ref === null) return null;
    return {
        lecture: ref,
        summary: str(value.summary),
        topics: list(value.topics, (t) => ({ title: str(t.title, 300), points: strs(t.points, 12) }), 40),
        definitions: list(value.definitions, (d) => ({ term: str(d.term, 200), meaning: str(d.meaning) }), 60),
        formulas: list(value.formulas, (f) => ({ name: str(f.name, 200), tex: str(f.tex, 1000), note: str(f.note) }), 60),
        examples: list(value.examples, (e) => ({ title: str(e.title, 300), setup: str(e.setup), steps: strs(e.steps, 20), answer: str(e.answer) }), 30),
        quotes: list(value.quotes, (q) => ({ text: str(q.text, 1000), about: str(q.about, 300), kind: QUOTE_KINDS.includes(q.kind as QuoteKind) ? (q.kind as QuoteKind) : 'emphasis' }), 60),
        exam_notes: strs(value.exam_notes, 40),
        traps: strs(value.traps, 40),
        skipped: strs(value.skipped, 40),
    };
};
