// Open one UD service in the sign-in browser on the strength of a live CAS session: visit its entry
// URL and let the redirects (CAS ticket, or SAML for Stellic) run until the browser is back on the
// service, signed in. No prompt is answered here — if CAS asks for a password, the CAS session has
// lapsed and the service is reported as not opened.

import type { Page } from 'puppeteer-core';
import { CAS_HOST, type UdServiceInfo } from '@/services/auth/ud-services';

const OPEN_TIMEOUT_MS = 30_000;

export async function openService(page: Page, service: UdServiceInfo): Promise<boolean> {
    try {
        await page.goto(service.entry, { waitUntil: 'domcontentloaded', timeout: OPEN_TIMEOUT_MS });
    } catch {
        // A SAML hop can abort the first navigation; the URL check below is what decides.
    }
    const deadline = Date.now() + OPEN_TIMEOUT_MS;
    while (Date.now() < deadline) {
        const url = new URL(page.url());
        if (service.signedIn(url)) return true;
        if (url.hostname === CAS_HOST && (await page.$('#password').catch(() => null))) return false;
        await new Promise((resolve) => setTimeout(resolve, 400));
    }
    return false;
}
