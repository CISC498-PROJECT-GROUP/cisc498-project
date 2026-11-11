// Joining a WebReg term to the Stellic plan's: WebReg names a term "2027 Spring Semester" (or
// "2027 Winter Session"), Stellic by season and the calendar year it runs in — the same pair. Pure.

import type { Season, Term } from '@/services/types/stellic';

const SEASONS: Season[] = ['Fall', 'Winter', 'Spring', 'Summer'];

/** "2027 Spring Semester" → {season: 'Spring', year: 2027}; null when the label names neither. */
export function seasonOf(label: string): { season: Season; year: number } | null {
    const season = SEASONS.find((s) => new RegExp(`\\b${s}\\b`, 'i').test(label));
    const year = /\b(20\d{2})\b/.exec(label)?.[1];
    return season && year ? { season, year: Number(year) } : null;
}

export function matchStellicTerm(label: string, terms: Term[]): Term | null {
    const want = seasonOf(label);
    return want ? (terms.find((t) => t.season === want.season && t.year === want.year) ?? null) : null;
}
