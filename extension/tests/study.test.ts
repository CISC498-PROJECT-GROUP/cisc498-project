import { describe, expect, it } from 'bun:test';
import { dayStamp, isoDay } from '@/services/format/dates';
import { inRange } from '@/services/study/lecture-range';
import { courseRef, shortCode, shortName } from '@/services/study/course-ref';
import { mapLimit } from '@/services/study/pool';

// The study pipeline's pure parts: how a course is named on the PDF, which lectures a range takes,
// the day formats tools speak, and the concurrency pool that paces calls to the backend.

describe('course naming', () => {
    it('takes the subject and number out of a Canvas code', () => {
        expect(shortCode('26F-CISC304-010')).toBe('CISC304');
        expect(shortCode('24F-MATH231-010 & -011')).toBe('MATH231');
        expect(shortCode('CISC 220')).toBe('CISC220');
        expect(shortCode('Honors Seminar')).toBe('Honors Seminar');
    });

    it('takes the title out of a Canvas name, and drops a name that is only a code', () => {
        expect(shortName('26F-CISC304-010: Logic for Programming')).toBe('Logic for Programming');
        expect(shortName('Data Structures')).toBe('Data Structures');
        expect(shortName('26F-CISC304-010')).toBe('');
    });

    it('names the instructor only when the course lists exactly one', () => {
        const course = { id: '1', code: 'CISC 220', name: 'Data Structures', color: '', term: null, percent: null, letter: null, url: '', teachers: [{ id: '9', name: 'Dr. Anita Patel', url: '' }] };
        expect(courseRef(course)).toEqual({ code: 'CISC220', name: 'Data Structures', instructor: 'Dr. Anita Patel' });
        expect(courseRef({ ...course, teachers: [...course.teachers, { id: '8', name: 'TA', url: '' }] }).instructor).toBe('');
    });
});

describe('inRange', () => {
    it('keeps the lectures recorded between two days, inclusive, and skips undated ones', () => {
        const lectures = ['2026-08-26', '2026-09-16', '2026-09-28', ''].map((date, i) => ({ id: String(i), title: 't', date, minutes: null }));
        expect(inRange(lectures, '2026-08-26', '2026-09-16').map((l) => l.id)).toEqual(['0', '1']);
    });
});

describe('days', () => {
    it('writes local calendar days both ways', () => {
        expect(isoDay(new Date(2026, 9, 7, 23, 30))).toBe('2026-10-07');
        expect(dayStamp('2026-10-13')).toBe('Tue, Oct 13, 2026');
        expect(dayStamp('soon')).toBe('soon');
    });
});

describe('mapLimit', () => {
    it('keeps order and never runs more than the limit at once', async () => {
        let running = 0;
        let peak = 0;
        const out = await mapLimit([30, 10, 20, 5, 15], 2, async (ms, i) => {
            running++;
            peak = Math.max(peak, running);
            await Bun.sleep(ms);
            running--;
            return i;
        });
        expect(out).toEqual([0, 1, 2, 3, 4]);
        expect(peak).toBe(2);
    });

    it('rejects when one item fails', async () => {
        await expect(mapLimit([1, 2], 2, async (n) => (n === 2 ? Promise.reject(new Error('boom')) : n))).rejects.toThrow('boom');
    });
});
