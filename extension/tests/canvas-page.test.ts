import { describe, expect, it } from 'bun:test';
import { isDashboard } from '@/services/canvas/canvas-page';

// The manifest matches every page on a Canvas domain; this is what keeps the widget to the
// dashboard. A false positive puts a floating button over course pages, a false negative hides it.

describe('isDashboard', () => {
    it('matches the site root and /dashboard', () => {
        expect(isDashboard('/')).toBe(true);
        expect(isDashboard('/dashboard')).toBe(true);
        expect(isDashboard('/dashboard/')).toBe(true);
    });

    it('does not match course, calendar or inbox pages', () => {
        for (const path of ['/courses/123', '/courses', '/calendar', '/conversations', '/courses/123/assignments/9']) expect(isDashboard(path)).toBe(false);
    });
});
