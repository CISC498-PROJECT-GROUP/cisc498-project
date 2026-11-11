import { describe, expect, test } from 'bun:test';
import { conflictsWith, findConflicts, meetingsOverlap } from '@/services/webreg/conflicts';
import { courseCode, courseIdOf, isLabId, parseSectionId, searchPrefix, sectionCode } from '@/services/webreg/section-id';
import { formatClock, formatMeeting, formatMeetings, formatRange, parseClock, parseDays } from '@/services/webreg/times';
import type { Meeting } from '@/services/types/webreg';

const meeting = (days: string, start: [number, number], end: [number, number], dates?: [string, string]): Meeting => ({ days: parseDays(days), start, end, location: null, startDate: dates?.[0] ?? null, endDate: dates?.[1] ?? null });

describe('meeting times', () => {
    test('reads days as an array or a string, in week order', () => {
        expect(parseDays(['R', 'T'])).toEqual(['T', 'R']);
        expect(parseDays('mwf')).toEqual(['M', 'W', 'F']);
        expect(parseDays(['X', 'S', 'U'])).toEqual(['S', 'U']);
        expect(parseDays(undefined)).toEqual([]);
    });

    test('reads [h, m] pairs and clock strings', () => {
        expect(parseClock([15, 55])).toEqual([15, 55]);
        expect(parseClock('09:05')).toEqual([9, 5]);
        expect(parseClock('3:55 PM')).toEqual([15, 55]);
        expect(parseClock('12:10 am')).toEqual([0, 10]);
        expect(parseClock([25, 0])).toBeNull();
        expect(parseClock('soon')).toBeNull();
    });

    test('formats times the way a schedule reads', () => {
        expect(formatClock([15, 55])).toBe('3:55 PM');
        expect(formatClock([0, 5])).toBe('12:05 AM');
        expect(formatClock([12, 0])).toBe('12:00 PM');
        expect(formatRange([15, 55], [17, 15])).toBe('3:55–5:15 PM');
        expect(formatRange([11, 15], [12, 5])).toBe('11:15 AM–12:05 PM');
        expect(formatMeeting(meeting('TR', [15, 55], [17, 15]))).toBe('TR 3:55–5:15 PM');
        expect(formatMeetings([])).toBe('No set meeting time');
    });
});

describe('section ids', () => {
    test('parses and displays ids as UD prints them', () => {
        expect(parseSectionId('CISC108010')).toEqual({ subject: 'CISC', number: '108', section: '010' });
        expect(sectionCode('CISC108020L')).toBe('CISC 108-020L');
        expect(sectionCode('weird')).toBe('weird');
        expect(courseCode('CISC108')).toBe('CISC 108');
        expect(courseCode('MATH241010')).toBe('MATH 241');
        expect(courseIdOf('CISC108020L')).toBe('CISC108');
        expect(isLabId('CISC108020L')).toBe(true);
        expect(isLabId('CISC108010')).toBe(false);
    });

    test('turns what the student typed into a lookup prefix', () => {
        expect(searchPrefix('cisc 1')).toBe('CISC1');
        expect(searchPrefix(' CISC 108-010 ')).toBe('CISC108010');
    });
});

describe('conflicts', () => {
    test('overlapping times on a shared day clash; back-to-back does not', () => {
        expect(meetingsOverlap(meeting('MWF', [10, 10], [11, 0]), meeting('W', [10, 30], [12, 0]))).toBe(true);
        expect(meetingsOverlap(meeting('MWF', [10, 10], [11, 0]), meeting('MWF', [11, 0], [11, 50]))).toBe(false);
        expect(meetingsOverlap(meeting('MWF', [10, 10], [11, 0]), meeting('TR', [10, 10], [11, 0]))).toBe(false);
    });

    test('sections in different halves of a term never clash', () => {
        const first = meeting('TR', [9, 30], [10, 45], ['02/08/2027', '03/26/2027']);
        const second = meeting('TR', [9, 30], [10, 45], ['03/29/2027', '05/18/2027']);
        expect(meetingsOverlap(first, second)).toBe(false);
        expect(meetingsOverlap(first, meeting('T', [10, 0], [11, 0]))).toBe(true);
    });

    test('finds every pair, both ways; online sections never conflict', () => {
        const items = [
            { id: 'A', meetings: [meeting('MWF', [10, 10], [11, 0])] },
            { id: 'B', meetings: [meeting('M', [10, 30], [11, 30])] },
            { id: 'C', meetings: [] },
            { id: 'D', meetings: [meeting('TR', [9, 30], [10, 45])] },
        ];
        const found = findConflicts(items);
        expect(found.get('A')).toEqual(['B']);
        expect(found.get('B')).toEqual(['A']);
        expect(found.has('C')).toBe(false);
        expect(found.has('D')).toBe(false);
        expect(conflictsWith([meeting('W', [10, 45], [11, 15])], items)).toEqual(['A']);
    });
});
