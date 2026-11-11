import { describe, expect, it } from 'bun:test';
import { normalizePasscode, normalizeUsername } from '@/services/auth/username';
import { parseRoute, routeHref, ROUTES } from '@/services/routes';

describe('parseRoute', () => {
    it('reads the page from the hash, with or without the slash', () => {
        expect(parseRoute('#/schedule')).toBe('schedule');
        expect(parseRoute('#schedule')).toBe('schedule');
        expect(parseRoute('#/Degree/')).toBe('degree');
        expect(parseRoute('#/deadlines?filter=all')).toBe('deadlines');
    });

    it('falls back to home for an empty or unknown hash', () => {
        expect(parseRoute('')).toBe('home');
        expect(parseRoute('#/')).toBe('home');
        expect(parseRoute('#/nowhere')).toBe('home');
    });

    it('round-trips every route through its href', () => {
        for (const r of ROUTES) expect(parseRoute(routeHref(r.id))).toBe(r.id);
        expect(routeHref('home')).toBe('#/');
    });
});

describe('normalizeUsername / normalizePasscode', () => {
    it('takes the UD username from a username or an email', () => {
        expect(normalizeUsername('  JDoe ')).toBe('jdoe');
        expect(normalizeUsername('jdoe@udel.edu')).toBe('jdoe');
        expect(normalizeUsername('')).toBeNull();
        expect(normalizeUsername('@udel.edu')).toBeNull();
        expect(normalizeUsername('j doe')).toBeNull();
    });

    it('accepts a 6–9 digit passcode, spaces ignored', () => {
        expect(normalizePasscode('123 456')).toBe('123456');
        expect(normalizePasscode('123456789')).toBe('123456789');
        expect(normalizePasscode('12345')).toBeNull();
        expect(normalizePasscode('12345a')).toBeNull();
    });
});
