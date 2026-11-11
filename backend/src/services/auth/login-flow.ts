// One student's sign-in, start to finish, run in the background while the site polls its status:
//
//   Canvas's login → CAS (username + password, filled in off-screen) → UD's 2FA page, brought on
//   screen in its own small window where the student enters the code UD sent them → back on Canvas
//   → Stellic and WebReg through single sign-on → the browser's cookies copied into the jar.
//
// The password is typed into CAS's form and then dropped; it is never stored or logged. The 2FA
// code never passes through the site at all. The browser context stays open with the session, so
// lapsed service sessions can be renewed (renew.ts).

import type { BrowserContext, Page } from 'puppeteer-core';
import type { LoginStatus, UdService } from '@canvas-assistant/shared';
import { casError, LoginError, submitCas } from '@/services/auth/cas';
import { jarSeed } from '@/services/auth/cookie-jar';
import { hideWindow, showWindow } from '@/services/auth/login-window';
import { openService } from '@/services/auth/open-service';
import { readPrompt } from '@/services/auth/second-factor';
import type { Session } from '@/services/auth/sessions';
import { CAS_HOST, UD_SERVICES } from '@/services/auth/ud-services';
import { newLoginContext } from '@/services/common/svc-browser';
import { createLogger } from '@/services/common/svc-log';

const log = createLogger('auth');
const LOGIN_TIMEOUT_MS = 4 * 60 * 1000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const set = (session: Session, status: LoginStatus): void => {
    session.status = status;
};

const VERIFY: LoginStatus = { step: 'verify', message: 'UD sent you a 2FA code. Enter it in the UD sign-in window that just opened — this page carries on by itself once UD accepts it.' };

const openPages = async (context: BrowserContext): Promise<Page[]> => (await context.pages()).filter((p) => !p.isClosed());

/** Follow CAS until a window is back on Canvas, signed in — showing UD's 2FA window when it asks. */
async function followSignOn(session: Session, context: BrowserContext, page: Page): Promise<void> {
    const canvas = UD_SERVICES[0]!;
    const deadline = Date.now() + LOGIN_TIMEOUT_MS;
    const shown = new Set<Page>();
    let quietOnCas = 0;
    let lastPlace = '';
    try {
        while (Date.now() < deadline) {
            const pages = await openPages(context);
            if (pages.some((p) => canvas.signedIn(new URL(p.url())))) return;
            if (shown.size > 0 && ![...shown].some((p) => !p.isClosed())) throw new LoginError('The UD sign-in window was closed before UD accepted the code. Sign in again.');
            // UD's 2FA can open in a popup: the newest window is the one in play.
            const active = pages.at(-1) ?? page;
            const url = new URL(active.url());
            const place = `${url.hostname}${url.pathname}${active === page ? '' : ' (popup)'}`;
            if (place !== lastPlace) {
                log.info('sign-in at', { place });
                lastPlace = place;
            }
            if (url.hostname === CAS_HOST) {
                const error = await casError(active);
                if (error) throw new LoginError(error);
                if (error === '' && ++quietOnCas > 12) throw new LoginError("UD didn't accept that username and password.");
            }
            const prompt = await readPrompt(active);
            if (prompt.present && !shown.has(active)) {
                log.info('sign-in showing UD 2FA window', { screen: prompt.glimpse });
                shown.add(active);
                await showWindow(active);
                set(session, VERIFY);
            }
            await sleep(600);
        }
        throw new LoginError('The sign-in took too long — UD may have timed out waiting for the code. Sign in again.');
    } finally {
        for (const p of shown) if (!p.isClosed()) await hideWindow(p);
    }
}

async function run(session: Session, username: string, password: string): Promise<void> {
    const started = Date.now();
    const context = await newLoginContext();
    session.context = context;
    const page = await context.newPage();
    await hideWindow(page);
    log.info('sign-in started');
    await page.goto(UD_SERVICES[0]!.entry, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    set(session, { step: 'working', message: "Signing in to UD's CAS…" });
    await submitCas(page, username, password);
    log.info('sign-in submitted CAS form', { ms: Date.now() - started });
    set(session, { step: 'working', message: 'Checking with UD…' });
    await followSignOn(session, context, page);
    log.info('sign-in back on Canvas', { ms: Date.now() - started });

    set(session, { step: 'working', message: 'Signed in — opening Stellic and WebReg…' });
    const work = (await openPages(context)).find((p) => UD_SERVICES[0]!.signedIn(new URL(p.url()))) ?? page;
    await hideWindow(work);
    const services: Record<UdService, boolean> = { canvas: true, stellic: false, webreg: false };
    for (const service of UD_SERVICES.slice(1)) {
        services[service.service] = await openService(work, service);
        log.info('sign-in opened', { service: service.service, ok: services[service.service], at: new URL(work.url()).hostname });
    }
    jarSeed(session.jar, await context.cookies());
    for (const p of await openPages(context)) await p.close().catch(() => undefined);
    log.info('signed in', { ms: Date.now() - started, stellic: services.stellic, webreg: services.webreg });
    set(session, { step: 'signed-in', message: 'Signed in.', services, username });
}

/** Start signing a student in. Returns at once; progress shows in session.status. */
export function startLogin(session: Session, username: string, password: string): void {
    void run(session, username, password).catch(async (error: unknown) => {
        const message = error instanceof LoginError ? error.message : "UD's sign-in didn't finish. Try again in a minute.";
        // A LoginError's text is UD's or ours, never the student's; an unexpected error's is puppeteer's.
        log.warn('sign-in failed', { kind: error instanceof LoginError ? 'refused' : error instanceof Error ? error.name : 'unknown', reason: error instanceof Error ? error.message.slice(0, 200) : undefined });
        set(session, { step: 'failed', message });
        await session.context?.close().catch(() => undefined);
        session.context = null;
    });
}
