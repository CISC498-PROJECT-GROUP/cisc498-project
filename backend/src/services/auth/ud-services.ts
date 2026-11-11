// The University of Delaware systems the site signs a student into, and the sign-on hosts between
// them. All three sit behind the same CAS (cas.nss.udel.edu, with UD's own 2FA); Stellic reaches it through
// UD's SAML IdP (idp.nss.udel.edu). Visiting a service's `entry` with a live CAS session signs the
// browser into that service without a prompt — which is how the sign-in opens all three, and how an
// expired service session is renewed later.

import type { UdService } from '@canvas-assistant/shared';

export interface UdServiceInfo {
    service: UdService;
    host: string;
    /** Where a browser goes to start (or renew) this service's session. */
    entry: string;
    /** True once the browser, having followed sign-on, is back on the service signed in. */
    signedIn: (url: URL) => boolean;
}

export const UD_SERVICES: readonly UdServiceInfo[] = [
    { service: 'canvas', host: 'udel.instructure.com', entry: 'https://udel.instructure.com/login', signedIn: (u) => u.hostname === 'udel.instructure.com' && !u.pathname.startsWith('/login') },
    { service: 'stellic', host: 'stellic.udel.edu', entry: 'https://stellic.udel.edu/app/planner', signedIn: (u) => u.hostname === 'stellic.udel.edu' && u.pathname.startsWith('/app/') },
    { service: 'webreg', host: 'webreg.nss.udel.edu', entry: 'https://webreg.nss.udel.edu/registration/', signedIn: (u) => u.hostname === 'webreg.nss.udel.edu' && /^\/registration\/(schedule|start|planner)/.test(u.pathname) },
];

export const CAS_HOST = 'cas.nss.udel.edu';

/** Hosts a signed-out request gets sent to: landing on one means the service session has lapsed. */
export const isSignOnHost = (host: string): boolean => host === CAS_HOST || host === 'idp.nss.udel.edu' || host.endsWith('.duosecurity.com');

export const serviceForHost = (host: string): UdServiceInfo | null => UD_SERVICES.find((s) => s.host === host) ?? null;

export const isDuoHost = (host: string): boolean => host.endsWith('.duosecurity.com');
