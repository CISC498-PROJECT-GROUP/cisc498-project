// Noticing UD's second factor in the sign-in browser. After the password, CAS asks for a 2FA code on
// a page of its own ("Two-factor authentication (2FA) … 2FA code"), sometimes in a popup; a Duo
// deployment would show a *.duosecurity.com page instead. Either way the student answers it
// themselves, in that window (login-window.ts) — this module only says whether one is up, and gives
// the start of its text for the sign-in log. It never reads or types a code.

import type { Page } from 'puppeteer-core';
import { CAS_HOST, isDuoHost } from '@/services/auth/ud-services';

export interface Prompt {
    /** A second-factor page (CAS's own or Duo's) is showing in this window. */
    present: boolean;
    /** The start of the screen's text — for the sign-in log, never the student. */
    glimpse: string;
}

const NONE: Prompt = { present: false, glimpse: '' };

/** Runs in the page: CAS's username/password form is not a second factor; any other CAS page is. */
const READ = `(() => {
    if (document.querySelector('#password')) return null;
    return (document.body ? document.body.innerText : '').replace(/\\s+/g, ' ').trim().slice(0, 240);
})()`;

const onPromptHost = (frameUrl: string): boolean => {
    try {
        const host = new URL(frameUrl).hostname;
        return host === CAS_HOST || isDuoHost(host);
    } catch {
        return false;
    }
};

export async function readPrompt(page: Page): Promise<Prompt> {
    if (page.isClosed()) return NONE;
    for (const frame of page.frames().filter((f) => onPromptHost(f.url()))) {
        const text = (await frame.evaluate(READ).catch(() => null)) as string | null;
        if (text !== null) return { present: true, glimpse: text };
    }
    return NONE;
}
