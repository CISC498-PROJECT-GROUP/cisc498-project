/* Signing a student in. The site has no login of its own: the student's UD username and password go
   to UD's CAS once, through a browser the backend drives, and the sessions that sign-in leaves
   behind — Canvas, Stellic, WebReg — are what every later request rides on. The password is used
   for that one sign-in and never kept.

   UD's second factor is UD's own: when CAS asks for the 2FA code, the sign-in browser's window
   comes up on the student's screen showing UD's page, the student enters the code THERE, and the
   site waits. The site never asks for, sees or relays the code. */

/** POST /auth/login. */
export interface LoginRequest {
    username: string;
    password: string;
}

/** Where a sign-in stands. The site polls GET /auth/status and renders one screen per step. */
export type LoginStep =
    /** Talking to CAS, or opening Canvas, Stellic and WebReg; nothing for the student to do. */
    | 'working'
    /** UD's own sign-in window is on screen asking for the 2FA code; the student finishes there. */
    | 'verify'
    /** Signed in — every service below is ready, or says why not. */
    | 'signed-in'
    /** The sign-in ended without a session. `message` says why. */
    | 'failed';

/** One UD system the sign-in opened a session for. */
export type UdService = 'canvas' | 'stellic' | 'webreg';

export interface LoginStatus {
    step: LoginStep;
    /** Written for the student: what is happening, or what went wrong. */
    message: string;
    /** On signed-in: whether each service's session was established. */
    services?: Record<UdService, boolean>;
    /** On signed-in: the UD username, for the greeting and the sign-out menu. */
    username?: string;
}
