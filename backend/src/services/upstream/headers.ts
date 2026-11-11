// The headers each UD system expects on a request, beyond the student's cookies:
//
//   - Canvas writes carry X-CSRF-Token, the URL-decoded value of its `_csrf_token` cookie.
//   - Stellic POSTs pass Django's CSRF check only with X-CSRFToken (its `csrftoken` cookie) AND
//     Origin/Referer set to Stellic itself — see docs/stellic-integration.html. A browser page can't
//     set those; the server can, which is one thing the site gains over the extension.
//   - WebReg POSTs carry X-CSRF-TOKEN, the token in the <meta name="_csrf"> of its schedule page
//     (Spring Security). The proxy reads it off every WebReg page it relays (sniffWebregCsrf).

import { jarGet } from '@/services/auth/cookie-jar';
import type { Session } from '@/services/auth/sessions';

/** A current desktop Chrome — what UD's systems see from the sign-in browser too. */
export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36';

const PASSED_THROUGH = ['accept', 'content-type', 'x-requested-with'] as const;

export function upstreamHeaders(session: Session, url: URL, method: string, incoming: Headers): Headers {
    const headers = new Headers({ 'user-agent': USER_AGENT, 'accept-language': 'en-US,en;q=0.9' });
    for (const name of PASSED_THROUGH) {
        const value = incoming.get(name);
        if (value) headers.set(name, value);
    }
    if (method === 'GET' || method === 'HEAD') return headers;
    const origin = `https://${url.hostname}`;
    if (url.hostname === 'udel.instructure.com') {
        const token = jarGet(session.jar, url, '_csrf_token');
        if (token) headers.set('x-csrf-token', decodeURIComponent(token));
    } else if (url.hostname === 'stellic.udel.edu') {
        const token = jarGet(session.jar, url, 'csrftoken');
        if (token) headers.set('x-csrftoken', token);
        headers.set('origin', origin);
        headers.set('referer', `${origin}/app/planner`);
    } else if (url.hostname === 'webreg.nss.udel.edu') {
        if (session.webregCsrf) headers.set('x-csrf-token', session.webregCsrf);
        headers.set('origin', origin);
        headers.set('referer', `${origin}/registration/`);
        headers.set('x-requested-with', 'XMLHttpRequest');
    }
    return headers;
}

/** Remember WebReg's CSRF token from a page it served. */
export function sniffWebregCsrf(session: Session, url: URL, contentType: string, body: ArrayBuffer): void {
    if (url.hostname !== 'webreg.nss.udel.edu' || !contentType.includes('html')) return;
    const token = /<meta\s+name="_csrf"\s+content="([^"]+)"/.exec(new TextDecoder().decode(body))?.[1];
    if (token) session.webregCsrf = token;
}
