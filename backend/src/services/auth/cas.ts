// UD's CAS login page (cas.nss.udel.edu/cas/login), driven in the sign-in browser. The form is
// plain: #username, #password, hidden `execution` and `_eventId`, and a submit button. A refused
// password comes back as the same form with an error panel.

import type { Page } from 'puppeteer-core';

export class LoginError extends Error {}

/** No UD session (or it has lapsed past what single sign-on can renew). */
export class SignedOutError extends Error {
    constructor(message = 'Your UD sign-in has expired — sign in again.') {
        super(message);
    }
}

/** Fill CAS's form and submit it. The password goes into the page and nowhere else. */
export async function submitCas(page: Page, username: string, password: string): Promise<void> {
    try {
        await page.waitForSelector('#username', { timeout: 30_000 });
    } catch {
        throw new LoginError("UD's sign-in page didn't load. Try again in a minute.");
    }
    await page.type('#username', username);
    await page.type('#password', password);
    await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => undefined), page.click('button[name="submitButton"], button[type="submit"], input[type="submit"]')]);
}

/** Runs in the page (a string: the backend compiles without the DOM's types — so regex escapes are
    doubled). CAS wraps the reason in "Correct the error below, and then click Log in"; keep the reason. */
const CAS_ERROR = String.raw`(() => {
    if (!document.querySelector('#password')) return null;
    const panel = document.querySelector('#loginErrorsPanel, .alert-danger, .errors, [role="alert"], .banner-danger');
    if (!panel) return '';
    const lines = (panel.innerText || panel.textContent || '').split(/\n+/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const reasons = lines.filter((l) => !/correct the error|then click|^log ?in$/i.test(l));
    return (reasons.length ? reasons : lines).join(' ');
})()`;

/** On the CAS form: its error text, '' when it shows none. Off it: null. */
export async function casError(page: Page): Promise<string | null> {
    return page
        .evaluate(CAS_ERROR)
        .then((value) => (typeof value === 'string' ? value : null))
        .catch(() => null);
}
