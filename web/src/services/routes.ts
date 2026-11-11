// The site's pages and their hash routes. The site routes on the hash (#/schedule) so any static
// host can serve it — every path answers with index.html and the hash never reaches the server.
//
// Pure: parseRoute and routeHref test without a browser.

import type { IconName } from '@/components/common/icon';

export type RouteId = 'home' | 'schedule' | 'courses' | 'deadlines' | 'assistant' | 'degree' | 'help';

export interface RouteInfo {
    id: RouteId;
    /** In the nav and the page heading. */
    label: string;
    /** The bottom nav on a phone has room for one short word. */
    short: string;
    icon: IconName;
}

export const ROUTES: RouteInfo[] = [
    { id: 'home', label: 'Home', short: 'Home', icon: 'home' },
    { id: 'schedule', label: 'Schedule', short: 'Schedule', icon: 'calendar' },
    { id: 'courses', label: 'Courses', short: 'Courses', icon: 'grades' },
    { id: 'deadlines', label: 'Deadlines', short: 'Due', icon: 'clock' },
    { id: 'assistant', label: 'Assistant', short: 'Ask', icon: 'sparkle' },
    { id: 'degree', label: 'Degree', short: 'Degree', icon: 'cap' },
    { id: 'help', label: 'Help', short: 'Help', icon: 'help' },
];

const IDS = new Set<string>(ROUTES.map((r) => r.id));

/** "#/schedule", "#schedule", "#/schedule/" → 'schedule'; anything unknown (or empty) → 'home'. */
export function parseRoute(hash: string): RouteId {
    const first = hash.replace(/^#\/?/, '').split(/[/?]/)[0]!.toLowerCase();
    return IDS.has(first) ? (first as RouteId) : 'home';
}

export const routeHref = (id: RouteId): string => (id === 'home' ? '#/' : `#/${id}`);

export const routeInfo = (id: RouteId): RouteInfo => ROUTES.find((r) => r.id === id)!;
