// Reading and answering Duo's prompt in the sign-in browser. Duo's Universal Prompt is a page on a
// *.duosecurity.com host (older deployments put it in an iframe, so every frame on a Duo host is
// read). Duo changes its markup without notice, so the page is read by what it SAYS — headings,
// button labels — with the few stable selectors as a first try. If Duo moves on, the sign-in fails
// with "Duo showed a screen the site doesn't recognise" rather than doing something it shouldn't;
// LOGIN_BROWSER_VISIBLE=1 shows the browser so the new screen can be seen.

import type { Frame, Page } from 'puppeteer-core';
import type { DuoMethod } from '@canvas-assistant/shared';
import { isDuoHost } from '@/services/auth/ud-services';

export type DuoKind = 'waiting' | 'passcode' | 'choose' | 'trust' | 'error' | 'unknown';

export interface DuoView {
    kind: DuoKind;
    methods: DuoMethod[];
    /** Duo's own words for an error, shown to the student. */
    error: string | null;
}

const duoFrames = (page: Page): Frame[] =>
    page.frames().filter((frame) => {
        try {
            return isDuoHost(new URL(frame.url()).hostname);
        } catch {
            return false;
        }
    });

/** Runs in the page: what Duo is showing, read from its text and controls. */
const READ = `(() => {
    const text = document.body ? document.body.innerText : '';
    const labels = [...document.querySelectorAll('button, a, [role=button], li, label')].map((e) => (e.innerText || '').trim()).filter(Boolean);
    const passcode = !!document.querySelector('input[name="passcode-input"], #passcode-input, input[autocomplete="one-time-code"], input[name="passcode"]');
    const errorEl = document.querySelector('[role=alert], .message-text.error, .error-message, .alert-error');
    return { text, labels, passcode, error: errorEl ? (errorEl.innerText || '').trim() : '' };
})()`;

interface Raw {
    text: string;
    labels: string[];
    passcode: boolean;
    error: string;
}

function classify(raw: Raw): DuoView {
    const all = `${raw.text}\n${raw.labels.join('\n')}`;
    const methods: DuoMethod[] = [];
    if (/duo push/i.test(all)) methods.push('push');
    if (/phone call/i.test(all)) methods.push('call');
    if (/passcode|bypass code|text message/i.test(all)) methods.push('passcode');
    const error =
        raw.error ||
        (/(timed out|was denied|request denied|expired|too many|incorrect passcode|invalid passcode|couldn.t be completed)/i.exec(raw.text)
            ? (raw.text.split('\n').find((l) => /(timed out|denied|expired|too many|incorrect|invalid|couldn.t)/i.test(l)) ?? '').trim()
            : '');
    if (/is this your device|trust this browser/i.test(raw.text)) return { kind: 'trust', methods, error: null };
    if (error !== '' && raw.labels.some((l) => /try again/i.test(l))) return { kind: 'error', methods, error };
    if (raw.passcode) return { kind: 'passcode', methods, error: error || null };
    if (/check for a duo push|sent a request|sent a duo push|we.re calling|calling your phone|verify.*push/i.test(raw.text)) return { kind: 'waiting', methods, error: null };
    if (/other options|choose an authentication method|how would you like to|select an option/i.test(all) && methods.length > 0) return { kind: 'choose', methods, error: error || null };
    return { kind: 'unknown', methods, error: error || null };
}

/** What the Duo prompt is showing now; 'unknown' while it is still loading. */
export async function readDuo(page: Page): Promise<DuoView> {
    for (const frame of duoFrames(page)) {
        try {
            const view = classify((await frame.evaluate(READ)) as Raw);
            if (view.kind !== 'unknown') return view;
        } catch {
            // A frame navigating away mid-read; the next poll reads it again.
        }
    }
    return { kind: 'unknown', methods: [], error: null };
}

/** Runs in the page: click the first visible control whose label matches `pattern`. */
const clickScript = (pattern: RegExp): string => `(() => {
    const re = new RegExp(${JSON.stringify(pattern.source)}, ${JSON.stringify(pattern.flags)});
    const el = [...document.querySelectorAll('button, a, [role=button], li, label, input[type=submit]')].find((e) => e.offsetParent !== null && re.test((e.innerText || e.value || '').trim()));
    if (!el) return false;
    el.click();
    return true;
})()`;

/** Click the first visible control whose label matches. True when one was clicked. */
async function clickByText(page: Page, pattern: RegExp): Promise<boolean> {
    for (const frame of duoFrames(page)) {
        const clicked = await frame.evaluate(clickScript(pattern)).catch(() => false);
        if (clicked) return true;
    }
    return false;
}

const METHOD_LABEL: Record<DuoMethod, RegExp> = { push: /duo push/i, call: /phone call/i, passcode: /duo mobile passcode|enter a passcode|bypass code|passcode/i };

/** Switch Duo to a method — through "Other options" when the method list is not showing. */
export async function chooseMethod(page: Page, method: DuoMethod): Promise<boolean> {
    if (await clickByText(page, METHOD_LABEL[method])) return true;
    if (!(await clickByText(page, /other options/i))) return false;
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return clickByText(page, METHOD_LABEL[method]);
}

/** Type a passcode into Duo and submit it. */
export async function enterPasscode(page: Page, code: string): Promise<boolean> {
    for (const frame of duoFrames(page)) {
        const input = await frame.$('input[name="passcode-input"], #passcode-input, input[autocomplete="one-time-code"], input[name="passcode"]');
        if (!input) continue;
        await input.click({ count: 3 });
        await input.type(code, { delay: 20 });
        await input.press('Enter');
        return true;
    }
    return false;
}

export const retryDuo = (page: Page): Promise<boolean> => clickByText(page, /try again/i);

/** "Is this your device?" — no where Duo offers it: the browser is the server's, and its context is
    thrown away with the session. Either answer only affects that throwaway context. */
export const declineTrust = async (page: Page): Promise<boolean> => (await clickByText(page, /^no\b|other people use this device|don.t trust/i)) || clickByText(page, /trust/i);
