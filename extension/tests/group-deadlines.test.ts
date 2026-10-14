import { describe, expect, it } from 'bun:test';
import { dayLabel, greeting, rangeLabel, relativeDue } from '@/services/format/dates';
import { groupDeadlines, nextMove } from '@/services/format/group-deadlines';
import type { Deadline } from '@/services/types';

// The deadlines view and the home counts. Overdue-and-unsubmitted work must never be hidden by the
// "To do" filter — that is the one thing a student most needs to see.

const NOW = new Date(2026, 8, 28, 13, 0); // Mon Sep 28, 1 PM

const item = (id: string, day: number, hour: number, submitted = false): Deadline => ({
    id,
    courseId: 'c',
    assignmentId: null,
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

describe('nextMove', () => {
    it('leads with overdue work and lists the rest of the next 48 hours', () => {
        const move = nextMove(LIST, NOW);
        expect(move.overdue.map((d) => d.id)).toEqual(['late']);
        expect(move.focus?.id).toBe('late');
        expect(move.soon.map((d) => d.id)).toEqual(['tonight', 'tomorrow-a']);
    });

    it('with nothing overdue, focuses the next item and leaves it out of the list', () => {
        const move = nextMove(
            LIST.filter((d) => d.id !== 'late'),
            NOW,
        );
        expect(move.focus?.id).toBe('tonight');
        expect(move.soon.map((d) => d.id)).toEqual(['tomorrow-a']);
    });

    it('has no focus when everything is turned in', () => {
        expect(nextMove([item('done', 29, 9, true)], NOW)).toEqual({ overdue: [], focus: null, soon: [] });
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

    it('says how soon something is due, in hours inside a day', () => {
        expect(relativeDue(new Date(2026, 8, 28, 13, 30), NOW)).toBe('Within the hour');
        expect(relativeDue(new Date(2026, 8, 28, 23, 59), NOW)).toBe('In 11h');
        expect(relativeDue(new Date(2026, 9, 1, 23, 59), NOW)).toBe('Thu · 11:59 PM');
    });

    it('labels a range of days across a month boundary', () => {
        expect(rangeLabel(NOW, 14)).toBe('Sep 28 – Oct 11');
    });
});
