// Renewing one service's session when it lapses (Canvas, Stellic and WebReg each time out on their
// own, well before UD's CAS session does). The jar's cookies go back into the student's sign-in
// browser, the browser visits the service's entry URL — CAS single sign-on answers without a prompt
// — and the browser's cookies come back into the jar. Concurrent requests share one renewal.
//
// Throws SignedOutError when there is no browser left or CAS itself wants the password again: the
// student has to sign in afresh.

import { SignedOutError } from '@/services/auth/cas';
import { jarExport, jarSeed } from '@/services/auth/cookie-jar';
import { openService } from '@/services/auth/open-service';
import type { Session } from '@/services/auth/sessions';
import type { UdServiceInfo } from '@/services/auth/ud-services';
import { createLogger } from '@/services/common/svc-log';

const log = createLogger('auth');

async function renewNow(session: Session, service: UdServiceInfo): Promise<void> {
    const context = session.context;
    if (!context) throw new SignedOutError();
    await context.setCookie(...jarExport(session.jar).map((c) => ({ ...c, sameSite: c.sameSite as 'Strict' | 'Lax' | 'None', expires: c.expires < 0 ? undefined : c.expires })));
    const page = await context.newPage();
    try {
        const opened = await openService(page, service);
        log.info('renewed', { service: service.service, ok: opened });
        if (!opened) throw new SignedOutError();
        jarSeed(session.jar, await context.cookies());
    } finally {
        await page.close().catch(() => undefined);
    }
}

export function renewService(session: Session, service: UdServiceInfo): Promise<void> {
    const running = session.renewing[service.service];
    if (running) return running;
    const renewal = renewNow(session, service).finally(() => {
        delete session.renewing[service.service];
    });
    session.renewing[service.service] = renewal;
    return renewal;
}
