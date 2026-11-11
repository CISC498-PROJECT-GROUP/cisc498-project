// What the proxy will do with a student's UD session — and so what it will not. It is not an open
// proxy: only these hosts, and on each only reads, except for the few writes the site makes on the
// student's explicit say-so:
//
//   - Canvas: submitting the student's own assignment (and its file upload).
//   - WebReg: registration — add, drop, swap, edit — after the student confirms each change.
//   - Stellic: none. Its read endpoints are POSTs (Stellic's choice), so they are listed by name.
//   - Kaltura (the Media Gallery): the LTI launch Canvas signs, and Kaltura's caption API — reads in
//     effect, though both are POSTs.
//
// A host reached only by following a redirect (where Canvas keeps file bytes) is allowed for that
// redirect alone, never as a starting point.

export interface HostRule {
    matches: (host: string) => boolean;
    /** Paths a non-GET request may go to. */
    writes: readonly RegExp[];
}

const exact = (name: string) => (host: string) => host === name;
const under = (domain: string) => (host: string) => host === domain || host.endsWith(`.${domain}`);

const RULES: readonly HostRule[] = [
    { matches: exact('udel.instructure.com'), writes: [/^\/api\/v1\/courses\/\d+\/assignments\/\d+\/submissions(\/self\/files)?$/] },
    { matches: exact('stellic.udel.edu'), writes: [/^\/planner\/(getstudentplan|getauditinfo|getstudentprofile|getplanwarnings|searchcourses)\/$/] },
    { matches: exact('webreg.nss.udel.edu'), writes: [/^\/registration\/sisqueue\/(add|drop|swap|edit)$/] },
    { matches: under('kaltura.com'), writes: [/^\//] },
    // Canvas's file store: the upload a submission makes goes straight to it.
    { matches: under('inscloudgate.net'), writes: [/^\//] },
];

/** Hosts allowed only as the target of a redirect from an allowed host — Canvas file downloads. */
const REDIRECT_ONLY: readonly ((host: string) => boolean)[] = [under('instructure.com'), under('inscloudgate.net'), (h) => h.endsWith('.amazonaws.com') && h.includes('instructure')];

export const ruleFor = (host: string): HostRule | null => RULES.find((rule) => rule.matches(host)) ?? null;

export type Verdict = 'ok' | 'host' | 'write';

/** Whether a request the site asks for may start. */
export function allowRequest(url: URL, method: string): Verdict {
    if (url.protocol !== 'https:') return 'host';
    const rule = ruleFor(url.hostname);
    if (!rule) return 'host';
    if (method === 'GET' || method === 'HEAD') return 'ok';
    return rule.writes.some((path) => path.test(url.pathname)) ? 'ok' : 'write';
}

/** Whether a redirect may be followed to `url`. */
export const allowRedirect = (url: URL): boolean => url.protocol === 'https:' && (ruleFor(url.hostname) !== null || REDIRECT_ONLY.some((ok) => ok(url.hostname)));

/** The most a proxied response may carry. A Canvas PDF can be large; a gallery page is ~1 MB. */
export const MAX_RESPONSE_BYTES = 30 * 1024 * 1024;
