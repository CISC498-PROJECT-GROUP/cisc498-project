// Meeting times: WebReg's [hour, minute] pairs and day letters (M T W R F S U — R is Thursday, U
// Sunday), read tolerantly and shown the way a student reads a schedule ("TR 3:55–5:15 PM"). Pure.

import type { Clock, Day, Meeting } from '@/services/types/webreg';

export const DAYS: readonly Day[] = ['M', 'T', 'W', 'R', 'F', 'S', 'U'];

export const DAY_NAMES: Record<Day, string> = { M: 'Monday', T: 'Tuesday', W: 'Wednesday', R: 'Thursday', F: 'Friday', S: 'Saturday', U: 'Sunday' };
export const DAY_SHORT: Record<Day, string> = { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri', S: 'Sat', U: 'Sun' };

const isDay = (value: string): value is Day => (DAYS as readonly string[]).includes(value);

/** ["T", "R"] or "TR" → ['T', 'R'], in week order, unknown letters dropped. */
export function parseDays(raw: unknown): Day[] {
    const letters = Array.isArray(raw) ? raw.map(String) : typeof raw === 'string' ? raw.toUpperCase().split('') : [];
    const days = new Set(letters.map((d) => d.trim().toUpperCase()).filter(isDay));
    return DAYS.filter((d) => days.has(d));
}

/** [15, 55], "15:55" or "3:55 PM" → [15, 55]; null when it isn't a time. */
export function parseClock(raw: unknown): Clock | null {
    if (Array.isArray(raw) && raw.length >= 2) {
        const [h, m] = raw.map(Number);
        return valid(h, m) ? [h, m] : null;
    }
    if (typeof raw !== 'string') return null;
    const match = /^\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])?\s*$/.exec(raw);
    if (!match) return null;
    let h = Number(match[1]);
    const m = Number(match[2]);
    const pm = match[3]?.toUpperCase() === 'PM';
    if (match[3]) h = (h % 12) + (pm ? 12 : 0);
    return valid(h, m) ? [h, m] : null;
}

const valid = (h: number, m: number): boolean => Number.isInteger(h) && Number.isInteger(m) && h >= 0 && h < 24 && m >= 0 && m < 60;

export const toMinutes = ([h, m]: Clock): number => h * 60 + m;

/** [15, 55] → "3:55 PM"; with `bare`, no AM/PM ("3:55"). */
export function formatClock([h, m]: Clock, bare = false): string {
    const hour = h % 12 === 0 ? 12 : h % 12;
    const text = `${hour}:${String(m).padStart(2, '0')}`;
    return bare ? text : `${text} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "3:55–5:15 PM", or "11:15 AM–12:05 PM" across noon. */
export function formatRange(start: Clock, end: Clock): string {
    const sameHalf = start[0] < 12 === end[0] < 12;
    return `${formatClock(start, sameHalf)}–${formatClock(end)}`;
}

export const formatDays = (days: Day[]): string => days.join('');

/** "TR 3:55–5:15 PM" */
export const formatMeeting = (m: Meeting): string => `${formatDays(m.days)} ${formatRange(m.start, m.end)}`;

/** Every meeting of a section on one line, or "No set meeting time" (an online section). */
export const formatMeetings = (meetings: Meeting[]): string => (meetings.length ? meetings.map(formatMeeting).join(' · ') : 'No set meeting time');

/** "8am", "1pm" — a calendar's hour labels. */
export const hourLabel = (hour: number): string => `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 || hour === 24 ? 'am' : 'pm'}`;

/** MM/DD/YYYY → a comparable day number, or null. */
export function dayNumber(date: string | null): number | null {
    const m = date ? /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date) : null;
    return m ? Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2])) / 86_400_000 : null;
}
