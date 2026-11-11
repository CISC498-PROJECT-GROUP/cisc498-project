// One student's sign-in, start to finish, run in the background while the site polls its status:
//
//   Canvas's login → CAS (username + password) → Duo (push, call or passcode — the student answers
//   on the site, which relays it here) → back on Canvas → Stellic and WebReg through single sign-on
//   → the browser's cookies copied into the session's jar.
//
// The password is typed into CAS's form and then dropped; it is never stored or logged. The browser
// context stays open with the session, so lapsed service sessions can be renewed (renew.ts).

import type { Page } from 'puppeteer-core';
import type { DuoAction, LoginStatus, UdService } from '@canvas-assistant/shared';
import { casError, LoginError, submitCas } from '@/services/auth/cas';
import { jarSeed } from '@/services/auth/cookie-jar';
import { chooseMethod, declineTrust, enterPasscode, readDuo, retryDuo, type DuoView } from '@/services/auth/duo';
import { openService } from '@/services/auth/open-service';
import type { Session } from '@/services/auth/sessions';
import { CAS_HOST, UD_SERVICES } from '@/services/auth/ud-services';
import { newLoginContext } from '@/services/common/svc-browser';
import { createLogger } from '@/services/common/svc-log';

const log = createLogger('auth');
const LOGIN_TIMEOUT_MS = 4 * 60 * 1000;
/** How long a Duo screen the site can't read may stay up before the sign-in gives up on it. */
const UNKNOWN_DUO_MS = 45_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const set = (session: Session, status: LoginStatus): void => {
    session.status = status;
};

/** Act on the student's Duo answer, if one came in since the last poll. */
async function answer(page: Page, reply: DuoAction): Promise<void> {
    if (reply.action === 'method') await chooseMethod(page, reply.method);
    else if (reply.action === 'passcode') await enterPasscode(page, reply.code);
    else await retryDuo(page);
}

function show(session: Session, view: DuoView): void {
    if (view.kind === 'waiting') set(session, { step: 'duo-waiting', message: 'Duo is waiting for you — approve the sign-in on your phone.', methods: view.methods });
    else if (view.kind === 'passcode') set(session, { step: 'duo-passcode', message: view.error ?? 'Enter a passcode from Duo Mobile, a text message, or a bypass code.', methods: view.methods });
    else if (view.kind === 'choose' || view.kind === 'error') set(session, { step: 'duo-choose', message: view.error ?? 'How do you want to verify with Duo?', methods: view.methods });
}

/** Follow CAS and Duo until the browser is back on Canvas, signed in. */
async function followSignOn(session: Session, page: Page): Promise<void> {
    const canvas = UD_SERVICES[0]!;
    const deadline = Date.now() + LOGIN_TIMEOUT_MS;
    let pending: DuoAction | null = null;
    session.answer = (reply) => {
        pending = reply;
        set(session, { step: 'working', message: 'Checking with Duo…' });
    };
    let quietOnCas = 0;
    let unknownSince: number | null = null;
    while (Date.now() < deadline) {
        const url = new URL(page.url());
        if (canvas.signedIn(url)) return;
        if (url.hostname === CAS_HOST) {
            const error = await casError(page);
            if (error) throw new LoginError(error);
            if (error === '' && ++quietOnCas > 12) throw new LoginError("UD didn't accept that username and password.");
        }
        const view = await readDuo(page);
        unknownSince = view.present && view.kind === 'unknown' ? (unknownSince ?? Date.now()) : null;
        if (unknownSince !== null && Date.now() - unknownSince > UNKNOWN_DUO_MS) throw new LoginError("Duo showed a screen the site doesn't recognise. Sign in on Canvas directly, or try again later.");
        if (pending) {
            const reply: DuoAction = pending;
            pending = null;
            await answer(page, reply);
        } else if (view.kind === 'trust') await declineTrust(page);
        else show(session, view);
        await sleep(700);
    }
    throw new LoginError('The sign-in took too long — Duo may have timed out. Try again.');
}

async function run(session: Session, username: string, password: string): Promise<void> {
    const started = Date.now();
    const context = await newLoginContext();
    session.context = context;
    const page = await context.newPage();
    await page.goto(UD_SERVICES[0]!.entry, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await submitCas(page, username, password);
    await followSignOn(session, page);
    session.answer = null;

    set(session, { step: 'working', message: 'Signed in — opening Stellic and WebReg…' });
    const services: Record<UdService, boolean> = { canvas: true, stellic: false, webreg: false };
    for (const service of UD_SERVICES.slice(1)) services[service.service] = await openService(page, service);
    jarSeed(session.jar, await context.cookies());
    await page.close().catch(() => undefined);
    log.info('signed in', { ms: Date.now() - started, stellic: services.stellic, webreg: services.webreg });
    set(session, { step: 'signed-in', message: 'Signed in.', services, username });
}

/** Start signing a student in. Returns at once; progress shows in session.status. */
export function startLogin(session: Session, username: string, password: string): void {
    void run(session, username, password).catch(async (error: unknown) => {
        session.answer = null;
        const message = error instanceof LoginError ? error.message : "UD's sign-in didn't finish. Try again in a minute.";
        log.warn('sign-in failed', { kind: error instanceof LoginError ? 'refused' : error instanceof Error ? error.name : 'unknown' });
        set(session, { step: 'failed', message });
        await session.context?.close().catch(() => undefined);
        session.context = null;
    });
}
