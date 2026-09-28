import { describe, expect, it } from 'bun:test';
import { calendarDaysUntil, dateTile, dueSoonLabel, formatTime } from '@/services/format/dates';

// Deadline formatting counts CALENDAR days, not 24-hour periods: something due at 9 AM tomorrow is
// "Tomorrow" even when asked at 11 PM tonight.

const NOW = new Date(2026, 8, 28, 23, 0); // Mon Sep 28 2026, 11 PM local

describe('calendarDaysUntil', () => {
    it('counts calendar days, not elapsed hours', () => {
        expect(calendarDaysUntil(new Date(2026, 8, 28, 23, 59), NOW)).toBe(0);
        expect(calendarDaysUntil(new Date(2026, 8, 29, 1, 0), NOW)).toBe(1);
        expect(calendarDaysUntil(new Date(2026, 9, 1, 12, 0), NOW)).toBe(3);
    });
});

describe('dueSoonLabel', () => {
    it('labels today, tomorrow and two days out, and nothing further', () => {
        expect(dueSoonLabel(new Date(2026, 8, 28, 23, 59), NOW)).toBe('Due today');
        expect(dueSoonLabel(new Date(2026, 8, 29, 9, 0), NOW)).toBe('Tomorrow');
        expect(dueSoonLabel(new Date(2026, 8, 30, 9, 0), NOW)).toBe('In 2 days');
        expect(dueSoonLabel(new Date(2026, 9, 1, 9, 0), NOW)).toBeNull();
    });
});

describe('formatTime and dateTile', () => {
    it('formats 12-hour times', () => {
        expect(formatTime(new Date(2026, 8, 28, 23, 59))).toBe('11:59 PM');
        expect(formatTime(new Date(2026, 8, 28, 0, 5))).toBe('12:05 AM');
        expect(formatTime(new Date(2026, 8, 28, 12, 0))).toBe('12:00 PM');
    });

    it('builds the date tile', () => {
        expect(dateTile(new Date(2026, 9, 3))).toEqual({ month: 'Oct', day: '3', weekday: 'Sat' });
    });
});
