// One student's UD cookies, held in memory for as long as their session lives. The sign-in browser
// fills it (seed); every proxied request reads from it (header) and writes back what UD sets
// (store). It is the only place a student's UD session exists on the server, and it never touches
// disk or a log.
//
// Matching follows RFC 6265 closely enough for the hosts in play: a host-only cookie matches its
// exact host, a domain cookie matches the domain and its subdomains, the path is a prefix match,
// and an expired cookie is dropped.

export interface JarCookie {
    name: string;
    value: string;
    /** Lower-case, no leading dot. */
    domain: string;
    hostOnly: boolean;
    path: string;
    secure: boolean;
    /** Epoch ms; null for a session cookie. */
    expires: number | null;
    httpOnly: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
}

export type Jar = Map<string, JarCookie>;

export const createJar = (): Jar => new Map();

const keyOf = (c: Pick<JarCookie, 'name' | 'domain' | 'path'>): string => `${c.domain};${c.path};${c.name}`;

const domainMatches = (host: string, cookie: JarCookie): boolean => (cookie.hostOnly ? host === cookie.domain : host === cookie.domain || host.endsWith(`.${cookie.domain}`));

const pathMatches = (path: string, cookiePath: string): boolean => path === cookiePath || (path.startsWith(cookiePath) && (cookiePath.endsWith('/') || path[cookiePath.length] === '/'));

const live = (cookie: JarCookie, now: number): boolean => cookie.expires === null || cookie.expires > now;

function put(jar: Jar, cookie: JarCookie, now = Date.now()): void {
    if (live(cookie, now)) jar.set(keyOf(cookie), cookie);
    else jar.delete(keyOf(cookie));
}

/** The cookies a request to `url` would carry, most specific path first. */
export function jarCookies(jar: Jar, url: URL, now = Date.now()): JarCookie[] {
    const host = url.hostname.toLowerCase();
    return [...jar.values()].filter((c) => live(c, now) && domainMatches(host, c) && pathMatches(url.pathname || '/', c.path) && (!c.secure || url.protocol === 'https:')).sort((a, b) => b.path.length - a.path.length);
}

/** The Cookie header for a request to `url`, or '' when there is none. */
export const jarHeader = (jar: Jar, url: URL): string =>
    jarCookies(jar, url)
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');

/** One cookie's value as `url` would see it, or null. */
export const jarGet = (jar: Jar, url: URL, name: string): string | null => jarCookies(jar, url).find((c) => c.name === name)?.value ?? null;

const defaultPath = (url: URL): string => {
    const path = url.pathname;
    const slash = path.lastIndexOf('/');
    return slash <= 0 ? '/' : path.slice(0, slash);
};

/** Record what a response from `url` set. A Domain attribute that does not cover the host is refused. */
export function jarStore(jar: Jar, url: URL, setCookies: readonly string[], now = Date.now()): void {
    const host = url.hostname.toLowerCase();
    for (const header of setCookies) {
        let parsed: Bun.Cookie;
        try {
            parsed = Bun.Cookie.parse(header);
        } catch {
            continue;
        }
        const attr = parsed.domain?.toLowerCase().replace(/^\./, '') ?? '';
        if (attr !== '' && host !== attr && !host.endsWith(`.${attr}`)) continue;
        const maxAge = /;\s*max-age=(-?\d+)/i.exec(header)?.[1];
        const expires = maxAge !== undefined ? now + Number(maxAge) * 1000 : parsed.expires ? new Date(parsed.expires).getTime() : null;
        const sameSite = parsed.sameSite === 'strict' ? 'Strict' : parsed.sameSite === 'none' ? 'None' : 'Lax';
        put(
            jar,
            {
                name: parsed.name,
                value: parsed.value,
                domain: attr || host,
                hostOnly: attr === '',
                path: parsed.path && parsed.path.startsWith('/') ? parsed.path : defaultPath(url),
                secure: parsed.secure,
                expires,
                httpOnly: parsed.httpOnly,
                sameSite,
            },
            now,
        );
    }
}

/** The shape puppeteer reports a cookie in (BrowserContext.cookies()). */
export interface BrowserCookie {
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    secure: boolean;
    httpOnly?: boolean;
    /** Puppeteer also reports 'Default'; anything but Strict or None is treated as Lax. */
    sameSite?: string;
}

/** Replace the jar's contents with the browser's — after a sign-in or an SSO refresh. */
export function jarSeed(jar: Jar, cookies: readonly BrowserCookie[], now = Date.now()): void {
    jar.clear();
    for (const c of cookies) {
        const hostOnly = !c.domain.startsWith('.');
        put(
            jar,
            {
                name: c.name,
                value: c.value,
                domain: c.domain.toLowerCase().replace(/^\./, ''),
                hostOnly,
                path: c.path || '/',
                secure: c.secure,
                expires: c.expires > 0 ? c.expires * 1000 : null,
                httpOnly: c.httpOnly ?? false,
                sameSite: c.sameSite === 'Strict' || c.sameSite === 'None' ? c.sameSite : 'Lax',
            },
            now,
        );
    }
}

/** The jar as browser cookies, to hand back to the sign-in browser before an SSO refresh. */
export const jarExport = (jar: Jar): BrowserCookie[] =>
    [...jar.values()].map((c) => ({ name: c.name, value: c.value, domain: c.hostOnly ? c.domain : `.${c.domain}`, path: c.path, expires: c.expires === null ? -1 : c.expires / 1000, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite }));
