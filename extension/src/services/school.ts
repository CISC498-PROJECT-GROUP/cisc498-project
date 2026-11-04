// The school the dashboard page is built for. The Canvas widget needs no such setting — it runs on
// whatever Canvas page it is injected into — but the dashboard is an extension page, so it has to
// be told where the student's Canvas and Stellic live. Both are the University of Delaware's: Stellic
// is a per-school deployment, and UD's is the one this integration was reverse-engineered against
// (see docs/stellic-integration.html). Each origin must also be in the manifest's host_permissions.

export const CANVAS_ORIGIN = 'https://udel.instructure.com';
export const STELLIC_ORIGIN = 'https://stellic.udel.edu';
