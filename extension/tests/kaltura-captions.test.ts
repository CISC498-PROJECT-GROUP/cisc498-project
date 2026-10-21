import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';

// Finding a recording's captions with the sessions a gallery page carries. fetch is stubbed with a
// small Kaltura: the player's session may only fetch playback — so its captions come the way the
// player finds them, from the playback context, completed with the session — while a search session
// may list caption tracks directly. Outside Chrome, webRequest fetches directly, so the stub sees it.

(globalThis as { __API_BASE__?: string }).__API_BASE__ = 'http://localhost:3010';
const { captionFile } = await import('@/services/media/kaltura-api');
const { withSessions } = await import('@/services/media/kaltura-sessions');

const SERVICE = 'https://cdnapisec.kaltura.com';
const page = { origin: 'https://1.kaf.kaltura.com', categoryId: '9', partnerId: '1', serviceUrl: SERVICE, sessions: ['player', 'search'] };
const SRT = '1\n00:00:00,000 --> 00:00:02,000\nhello class\n';
const real_fetch = globalThis.fetch;
const asked: string[] = [];

const kaltura = (answer: (url: string, body: Record<string, unknown>) => unknown) => {
    globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
        const url = String(input);
        asked.push(url.replace(SERVICE, ''));
        const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};
        const out = answer(url, body);
        return typeof out === 'string' ? new Response(out) : out === null ? new Response('missing', { status: 404 }) : Response.json(out);
    }) as unknown as typeof fetch;
};

const refused = { objectType: 'KalturaAPIException', code: 'INVALID_KS', message: 'EXCEEDED_RESTRICTED_URI' };

// webRequest resolves URLs against the page; this file's page is set for its own tests only, so the
// other files' Canvas origin is untouched.
const globals = globalThis as { location?: unknown };
const real_location = globals.location;
beforeAll(() => {
    globals.location = { href: 'http://localhost:5174/', origin: 'http://localhost:5174' };
});
afterAll(() => {
    globals.location = real_location;
});

afterEach(() => {
    globalThis.fetch = real_fetch;
    asked.length = 0;
});

describe('captionFile', () => {
    it('lists the tracks and serves the best one when the session may', async () => {
        kaltura((url, body) => {
            if (url.endsWith('caption_captionasset/action/list')) return { objects: [{ id: 'c1', status: 2, languageCode: 'en' }], ks: body.ks };
            if (url.includes('/serve/captionAssetId/c1/ks/search')) return SRT;
            return refused;
        });
        expect(await captionFile(page, '1_a', 'search')).toBe(SRT);
    });

    it("falls back to the player's way: the playback context's caption URL, completed with the session", async () => {
        kaltura((url, body) => {
            if (url.endsWith('caption_captionasset/action/list')) return refused;
            if (url.endsWith('baseentry/action/getPlaybackContext') && body.ks === 'player') return { playbackCaptions: [{ languageCode: 'en', url: `${SERVICE}/api_v3/index.php/service/caption_captionasset/action/serve/captionAssetId/c1` }] };
            if (url.endsWith('/captionAssetId/c1')) return null;
            if (url.endsWith('/captionAssetId/c1/ks/player')) return SRT;
            return refused;
        });
        expect(await captionFile(page, '1_a', 'player')).toBe(SRT);
        expect(asked.at(-1)).toBe('/api_v3/index.php/service/caption_captionasset/action/serve/captionAssetId/c1/ks/player');
    });

    it('answers null for a recording with no captions, and refuses when no route is allowed', async () => {
        kaltura((url) => (url.endsWith('caption_captionasset/action/list') ? { objects: [] } : refused));
        expect(await captionFile(page, '1_a', 'search')).toBeNull();
        kaltura(() => refused);
        await expect(withSessions(['player', 'search'], (ks) => captionFile(page, '1_a', ks))).rejects.toThrow('EXCEEDED_RESTRICTED_URI');
    });
});
