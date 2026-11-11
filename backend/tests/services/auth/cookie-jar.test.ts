import { describe, expect, it } from 'bun:test';
import { createJar, jarExport, jarGet, jarHeader, jarSeed, jarStore } from '@/services/auth/cookie-jar';

const u = (s: string) => new URL(s);

describe('cookie jar', () => {
    it('sends a host-only cookie to its own host only', () => {
        const jar = createJar();
        jarStore(jar, u('https://stellic.udel.edu/app/planner'), ['sessionid=abc; Path=/; Secure; HttpOnly']);
        expect(jarHeader(jar, u('https://stellic.udel.edu/planner/getstudentplan/'))).toBe('sessionid=abc');
        expect(jarHeader(jar, u('https://webreg.nss.udel.edu/registration/'))).toBe('');
    });

    it('sends a domain cookie to the domain and its subdomains, never past it', () => {
        const jar = createJar();
        jarStore(jar, u('https://cas.nss.udel.edu/cas/login'), ['TGC=t; Domain=.nss.udel.edu; Path=/']);
        expect(jarHeader(jar, u('https://webreg.nss.udel.edu/registration/'))).toBe('TGC=t');
        expect(jarHeader(jar, u('https://stellic.udel.edu/'))).toBe('');
    });

    it('refuses a Domain attribute that does not cover the host that set it', () => {
        const jar = createJar();
        jarStore(jar, u('https://evil.kaltura.com/'), ['x=1; Domain=udel.edu']);
        expect(jarHeader(jar, u('https://udel.instructure.com/'))).toBe('');
    });

    it('matches paths by prefix, most specific first', () => {
        const jar = createJar();
        jarStore(jar, u('https://webreg.nss.udel.edu/registration/x'), ['a=root; Path=/', 'b=reg; Path=/registration']);
        expect(jarHeader(jar, u('https://webreg.nss.udel.edu/registration/schedule/2273'))).toBe('b=reg; a=root');
        expect(jarHeader(jar, u('https://webreg.nss.udel.edu/registrationX'))).toBe('a=root');
    });

    it('drops a cookie a later response expires', () => {
        const jar = createJar();
        const url = u('https://udel.instructure.com/');
        jarStore(jar, url, ['_csrf_token=abc%3D; Path=/']);
        expect(jarGet(jar, url, '_csrf_token')).toBe('abc%3D');
        jarStore(jar, url, ['_csrf_token=; Path=/; Max-Age=0']);
        expect(jarGet(jar, url, '_csrf_token')).toBeNull();
    });

    it('round-trips browser cookies (seed, then export)', () => {
        const jar = createJar();
        jarSeed(jar, [
            { name: 'sessionid', value: 's', domain: 'stellic.udel.edu', path: '/', expires: -1, secure: true, httpOnly: true, sameSite: 'Lax' },
            { name: 'TGC', value: 't', domain: '.nss.udel.edu', path: '/cas', expires: 4102444800, secure: true, sameSite: 'Default' },
        ]);
        expect(jarHeader(jar, u('https://stellic.udel.edu/x'))).toBe('sessionid=s');
        expect(jarHeader(jar, u('https://cas.nss.udel.edu/cas/login'))).toBe('TGC=t');
        const out = jarExport(jar);
        expect(out.find((c) => c.name === 'TGC')).toMatchObject({ domain: '.nss.udel.edu', path: '/cas', expires: 4102444800, sameSite: 'Lax' });
        expect(out.find((c) => c.name === 'sessionid')).toMatchObject({ domain: 'stellic.udel.edu', expires: -1 });
    });
});
