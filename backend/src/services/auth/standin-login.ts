// The sign-in when UD_STANDIN is set: no browser, no CAS, no Duo — the same steps the real sign-in
// walks through, faked on timers, so the site's sign-in screens can be worked on and every later
// request goes to the stand-in UD. Any username and password are accepted. Duo "sends a push" that
// approves itself after a few seconds; choosing a passcode instead accepts 123456 and refuses
// anything else, so the error path can be seen too.

import type { DuoAction } from '@canvas-assistant/shared';
import type { Session } from '@/services/auth/sessions';

const STANDIN_PASSCODE = '123456';
const AUTO_APPROVE_MS = 4000;

function signIn(session: Session, username: string): void {
    session.answer = null;
    session.status = { step: 'signed-in', message: 'Signed in (stand-in UD).', services: { canvas: true, stellic: true, webreg: true }, username };
}

export function startStandinLogin(session: Session, username: string): void {
    session.status = { step: 'working', message: 'Contacting UD (stand-in)…' };
    let approve: ReturnType<typeof setTimeout> | undefined;
    const waitForPush = () => {
        session.status = { step: 'duo-waiting', message: 'Duo is waiting for you — approve the sign-in on your phone. (Stand-in: approves itself.)', methods: ['push', 'call', 'passcode'] };
        approve = setTimeout(() => signIn(session, username), AUTO_APPROVE_MS);
    };
    session.answer = (reply: DuoAction) => {
        clearTimeout(approve);
        if (reply.action === 'passcode') {
            if (reply.code.trim() === STANDIN_PASSCODE) signIn(session, username);
            else session.status = { step: 'duo-passcode', message: 'Incorrect passcode. Try again. (Stand-in: 123456.)', methods: ['push', 'call', 'passcode'] };
        } else if (reply.action === 'method' && reply.method === 'passcode') {
            session.status = { step: 'duo-passcode', message: 'Enter a passcode from Duo Mobile, a text message, or a bypass code. (Stand-in: 123456.)', methods: ['push', 'call', 'passcode'] };
        } else waitForPush();
    };
    setTimeout(waitForPush, 800);
}
