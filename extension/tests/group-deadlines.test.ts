import { describe, expect, it } from 'bun:test';
import { dayLabel, greeting } from '@/services/format/dates';
import { glance, groupDeadlines } from '@/services/format/group-deadlines';
import type { Deadline } from '@/services/types';

// The deadlines view and the home counts. Overdue-and-unsubmitted work must never be hidden by the
// "To do" filter — that is the one thing a student most needs to see.

const NOW = new Date(2026, 8, 28, 13, 0); // Mon Sep 28, 1 PM

const item = (id: string, day: number, hour: number, submitted = false): Deadline => ({
    id,
    courseId: 'c',
    courseName: 'Course',
    title: id,
    dueAt: new Date(2026, 8, day, hour, 0),
    points: 10,
    url: null,
    kind: 'assignment',
    submitted,
    missing: false,
});

const LIST = [item('late', 27, 23), item('done-late', 26, 23, true), item('tonight', 28, 23), item('tomorrow-a', 29, 9), item('tomorrow-b', 29, 23, true), item('thu', 1 + 30, 12)];

describe('groupDeadlines', () => {
    it('to do: overdue first, then by day, finished work hidden', () => {
        const groups = groupDeadlines(LIST, NOW, 'todo');
        expect(groups.map((g) => [g.label, g.items.map((i) => i.id)])).toEqual([
            ['Overdue', ['late']],
            ['Today', ['tonight']],
            ['Tomorrow', ['tomorrow-a']],
            ['Thu, Oct 1', ['thu']],
        ]);
    });

    it('all: keeps finished work, including past submissions under their day', () => {
        const labels = groupDeadlines(LIST, NOW, 'all').map((g) => g.label);
        expect(labels).toEqual(['Overdue', 'Sat, Sep 26', 'Today', 'Tomorrow', 'Thu, Oct 1']);
    });
});

describe('glance', () => {
    it('counts unsubmitted work due in 48 hours and overdue work', () => {
        expect(glance(LIST, NOW)).toEqual({ dueSoon: 2, overdue: 1 });
    });
});

describe('greeting and dayLabel', () => {
    it('greets by time of day', () => {
        expect(greeting(new Date(2026, 8, 28, 9))).toBe('Good morning');
        expect(greeting(new Date(2026, 8, 28, 13))).toBe('Good afternoon');
        expect(greeting(new Date(2026, 8, 28, 20))).toBe('Good evening');
    });

    it('labels yesterday', () => {
        expect(dayLabel(new Date(2026, 8, 27, 12), NOW)).toBe('Yesterday');
    });
});
