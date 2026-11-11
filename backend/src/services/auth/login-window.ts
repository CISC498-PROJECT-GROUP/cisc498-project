// The sign-in browser's windows. They live off-screen (svc-browser.ts launches them there), so the
// student never sees CAS being filled in. When UD's 2FA page comes up, its window is brought on
// screen — a small window showing UD's own page, where the student enters the code UD sent them —
// and once the sign-in is past it, the window goes back off-screen. The site never sees the code.

import type { CDPSession, Page } from 'puppeteer-core';
import { app_env } from '@/services/common/svc-env';

const SHOWN = { left: 160, top: 100, width: 520, height: 720 };
const HIDDEN = { left: -32000, top: -32000, width: 520, height: 720 };

async function place(page: Page, bounds: typeof SHOWN): Promise<void> {
    let session: CDPSession | null = null;
    try {
        session = await page.createCDPSession();
        const { windowId } = (await session.send('Browser.getWindowForTarget')) as { windowId: number };
        await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'normal' } });
        await session.send('Browser.setWindowBounds', { windowId, bounds });
    } catch {
        // A window that closed mid-move; the sign-in loop notices a closed page itself.
    } finally {
        await session?.detach().catch(() => undefined);
    }
}

/** Bring UD's 2FA page in front of the student. */
export async function showWindow(page: Page): Promise<void> {
    await place(page, SHOWN);
    await page.bringToFront().catch(() => undefined);
}

/** Send a window back off-screen (unless LOGIN_BROWSER_VISIBLE keeps everything on screen). */
export async function hideWindow(page: Page): Promise<void> {
    if (!app_env.login_browser_visible) await place(page, HIDDEN);
}
