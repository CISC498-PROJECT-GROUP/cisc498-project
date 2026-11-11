// The stand-in Stellic: answers the four /planner/ endpoints src/services/stellic/load.ts calls,
// over the invented record in plan.ts, audit.ts and profile.ts. `url` arrives in its real form
// (https://stellic.udel.edu/planner/getstudentplan/). Every body starts with `)]}',` like Stellic's
// own. Anything else is left to the stand-in's 404. Never bundled.

import { auditInfo } from './audit';
import { studentPlan } from './plan';
import { reviewSummary, studentProfile } from './profile';

/** Stellic's JSON, behind its anti-hijacking prefix. */
const stellicJson = (body: unknown): Response => new Response(`)]}',\n${JSON.stringify(body)}`, { headers: { 'content-type': 'application/json' } });

const ENDPOINTS: Record<string, { method: 'GET' | 'POST'; body: () => unknown }> = {
    '/planner/getstudentplan/': { method: 'POST', body: studentPlan },
    '/planner/getauditinfo/': { method: 'POST', body: auditInfo },
    '/planner/getstudentprofile/': { method: 'POST', body: studentProfile },
    '/planner/plan-review-summary/': { method: 'GET', body: reviewSummary },
};

export function stellicRoute(req: Request, url: URL): Response | null {
    if (url.pathname === '/app/planner' || url.pathname.startsWith('/app/')) return new Response('<!doctype html><title>Stellic (stand-in)</title><p>Stand-in Stellic planner.</p>', { headers: { 'content-type': 'text/html' } });
    const endpoint = ENDPOINTS[url.pathname];
    if (!endpoint) return null;
    if (req.method !== endpoint.method) return new Response('Method not allowed', { status: 405 });
    return stellicJson(endpoint.body());
}
