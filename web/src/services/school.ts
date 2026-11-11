// The school the site is built for: the University of Delaware. Its Canvas and Stellic are where the
// student's links point, and the real URLs every client builds before handing them to the proxy
// (services/api/upstream.ts). WebReg is UD's registration system. Stellic is a per-school
// deployment, and UD's is the one this integration was reverse-engineered against (see
// docs/stellic-integration.html); the backend's proxy allows exactly these hosts.

export const CANVAS_ORIGIN = 'https://udel.instructure.com';
export const STELLIC_ORIGIN = 'https://stellic.udel.edu';
export const WEBREG_ORIGIN = 'https://webreg.nss.udel.edu';
