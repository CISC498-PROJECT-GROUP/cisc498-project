// Headless Chrome, for printing HTML to PDF. One browser, launched on first use and reused; each
// print gets its own page, closed afterwards. puppeteer-core drives an installed Chrome or Chromium
// rather than downloading its own: CHROME_PATH when set, otherwise the usual install locations.
// Without one, printing raises BrowserUnavailableError and the API carries on without it.
//
// The page may only load what it was given: every network request is refused, so nothing in a
// printed document can reach out, and the documents carry no script.

import { existsSync } from 'node:fs';
import puppeteer, { type Browser } from 'puppeteer-core';
import { app_env } from '@/services/common/svc-env';

export class BrowserUnavailableError extends Error {}

const CANDIDATES: Partial<Record<NodeJS.Platform, string[]>> = {
    win32: ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'],
    darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
    linux: ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'],
};

/** The browser to drive, or null when there is none. */
export function chromePath(): string | null {
    if (app_env.chrome_path !== '') return existsSync(app_env.chrome_path) ? app_env.chrome_path : null;
    return (CANDIDATES[process.platform] ?? []).find((path) => existsSync(path)) ?? null;
}

let browser: Promise<Browser> | null = null;

async function launch(): Promise<Browser> {
    const executablePath = chromePath();
    if (executablePath === null) throw new BrowserUnavailableError('PDF printing needs Chrome or Chromium on the server — install one or set CHROME_PATH in backend/.env.');
    // Chrome's sandbox needs kernel features container images usually lack; on Linux (the Docker
    // image) it runs without it, which is why the page is locked down instead.
    const args = ['--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-dev-shm-usage', ...(process.platform === 'linux' ? ['--no-sandbox'] : [])];
    const launched = await puppeteer.launch({ executablePath, headless: true, args });
    launched.on('disconnected', () => {
        browser = null;
    });
    return launched;
}

function getBrowser(): Promise<Browser> {
    browser ??= launch().catch((error: unknown) => {
        browser = null;
        throw error;
    });
    return browser;
}

/** The page's own print size and margins (its @page rule) are used, backgrounds included. */
export async function printPdf(html: string): Promise<Uint8Array> {
    const page = await (await getBrowser()).newPage();
    try {
        await page.setRequestInterception(true);
        page.on('request', (request) => void (request.url().startsWith('data:') ? request.continue() : request.abort()));
        await page.setContent(html, { waitUntil: 'load', timeout: 60_000 });
        // Embedded fonts decode asynchronously; print only once they have.
        await page.evaluate('document.fonts.ready.then(() => true)');
        return await page.pdf({ preferCSSPageSize: true, printBackground: true, timeout: 120_000 });
    } finally {
        await page.close().catch(() => undefined);
    }
}
