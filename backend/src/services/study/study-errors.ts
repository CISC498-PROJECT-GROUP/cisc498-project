// Failures the study service raises itself, mapped to a status by the route. Model-call failures are
// the shared ones in svc-model.ts.

/** The request is malformed or names something that isn't there — 435. */
export class StudyRequestError extends Error {}

/** PDF printing is unavailable on this server (no Chrome/Chromium found) — 503. */
export class StudyRenderUnavailableError extends Error {}
