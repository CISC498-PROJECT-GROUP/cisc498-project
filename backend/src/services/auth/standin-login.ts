// The sign-in when UD_STANDIN is set: no browser, no CAS, no UD window — the same steps the real
// sign-in walks through, faked on timers, so the site's sign-in screens can be worked on and every
// later request goes to the stand-in UD. Any username and password are accepted; the "2FA" step
// finishes by itself, since there is no UD window to enter a code in.

import type { Session } from '@/services/auth/sessions';

const VERIFY_AFTER_MS = 600;
const SIGNED_IN_AFTER_MS = 2500;

export function startStandinLogin(session: Session, username: string): void {
    session.status = { step: 'working', message: 'Contacting UD (stand-in)…' };
    setTimeout(() => {
        if (session.status.step !== 'working') return;
        session.status = { step: 'verify', message: 'UD sent you a 2FA code. Enter it in the UD sign-in window that just opened. (Stand-in: there is no window — this finishes by itself.)' };
        setTimeout(() => {
            if (session.status.step === 'verify') session.status = { step: 'signed-in', message: 'Signed in (stand-in UD).', services: { canvas: true, stellic: true, webreg: true }, username };
        }, SIGNED_IN_AFTER_MS);
    }, VERIFY_AFTER_MS);
}
