import { describe, expect, it } from 'bun:test';
import { allowRedirect, allowRequest } from '@/services/upstream/policy';

const u = (s: string) => new URL(s);

describe('upstream policy', () => {
    it('reads from the UD systems and nowhere else', () => {
        expect(allowRequest(u('https://udel.instructure.com/api/v1/courses'), 'GET')).toBe('ok');
        expect(allowRequest(u('https://stellic.udel.edu/planner/plan-review-summary/'), 'GET')).toBe('ok');
        expect(allowRequest(u('https://webreg.nss.udel.edu/registration/schedule/2273'), 'GET')).toBe('ok');
        expect(allowRequest(u('https://2358381.kaf.kaltura.com/channel/1'), 'GET')).toBe('ok');
        expect(allowRequest(u('https://example.com/'), 'GET')).toBe('host');
        expect(allowRequest(u('https://cas.nss.udel.edu/cas/login'), 'GET')).toBe('host');
        expect(allowRequest(u('http://udel.instructure.com/api/v1/courses'), 'GET')).toBe('host');
    });

    it('writes to Canvas only to submit the student’s own assignment', () => {
        expect(allowRequest(u('https://udel.instructure.com/api/v1/courses/1/assignments/2/submissions'), 'POST')).toBe('ok');
        expect(allowRequest(u('https://udel.instructure.com/api/v1/courses/1/assignments/2/submissions/self/files'), 'POST')).toBe('ok');
        expect(allowRequest(u('https://udel.instructure.com/api/v1/conversations'), 'POST')).toBe('write');
        expect(allowRequest(u('https://udel.instructure.com/api/v1/courses/1/discussion_topics'), 'POST')).toBe('write');
    });

    it('writes to WebReg only through registration’s four queue calls', () => {
        for (const op of ['add', 'drop', 'swap', 'edit']) expect(allowRequest(u(`https://webreg.nss.udel.edu/registration/sisqueue/${op}`), 'POST')).toBe('ok');
        expect(allowRequest(u('https://webreg.nss.udel.edu/registration/coursePermit'), 'POST')).toBe('write');
        expect(allowRequest(u('https://webreg.nss.udel.edu/registration/desiredLoad'), 'POST')).toBe('write');
    });

    it('lets Stellic take only its named read POSTs', () => {
        expect(allowRequest(u('https://stellic.udel.edu/planner/getstudentplan/'), 'POST')).toBe('ok');
        expect(allowRequest(u('https://stellic.udel.edu/planner/saveplan/'), 'POST')).toBe('write');
    });

    it('follows redirects to Canvas’s file store but never starts there', () => {
        expect(allowRedirect(u('https://inst-fs-iad-prod.inscloudgate.net/files/x'))).toBe(true);
        expect(allowRedirect(u('https://instructure-uploads.s3.amazonaws.com/a'))).toBe(true);
        expect(allowRequest(u('https://instructure-uploads.s3.amazonaws.com/a'), 'GET')).toBe('host');
        expect(allowRedirect(u('https://example.com/'))).toBe(false);
    });
});
