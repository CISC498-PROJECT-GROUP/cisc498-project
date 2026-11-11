/* Signing a student in. The site has no login of its own: the student's UD username and password go
   to UD's CAS (and Duo) once, through a browser the backend drives, and the sessions that sign-in
   leaves behind — Canvas, Stellic, WebReg — are what every later request rides on. The password is
   used for that one sign-in and never kept. */

/** POST /auth/login. */
export interface LoginRequest {
    username: string;
    password: string;
}

/** The second factor Duo offers. Push and phone call are approved on the student's phone; a passcode
    (from Duo Mobile, a text, or a bypass code) is typed into the site and passed on. */
export type DuoMethod = 'push' | 'call' | 'passcode';

/** Where a sign-in stands. The site polls GET /auth/status and renders one screen per step. */
export type LoginStep =
    /** Talking to CAS or Duo; nothing for the student to do. */
    | 'working'
    /** Duo sent a push (or is calling); waiting for the student to approve it on their phone. */
    | 'duo-waiting'
    /** Duo wants a passcode typed in. */
    | 'duo-passcode'
    /** Duo is asking how the student wants to verify. */
    | 'duo-choose'
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
    /** On duo-choose: the methods Duo offered. */
    methods?: DuoMethod[];
    /** On signed-in: whether each service's session was established. */
    services?: Record<UdService, boolean>;
    /** On signed-in: the UD username, for the greeting and the sign-out menu. */
    username?: string;
}

/** POST /auth/duo — the student's answer to a Duo step. */
export type DuoAction = { action: 'method'; method: DuoMethod } | { action: 'passcode'; code: string } | { action: 'retry' };
