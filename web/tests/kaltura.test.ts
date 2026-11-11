import { describe, expect, it } from 'bun:test';
import { KalturaError, withSessions } from '@/services/media/kaltura-sessions';
import { bestCaption, capturedDay, cardDate, durationMinutes, entryLecture, pageSessions, readGalleryPage } from '@/services/media/kaltura-parse';

// Reading Kaltura's gallery: the page's address and inline config name the gallery and its sessions;
// entries become lectures dated by recording day; the caption track worth reading is chosen; and a
// call falls through the page's sessions until Kaltura accepts one.

const PAGE = `<script>window.kms = {"partnerId":"2358381","serviceUrl":"https:\\/\\/www.kaltura.com","player":{"ks":"djJ8MjM1ODM4MXxhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFh"},"x":{"ks":"djJ8MjM1ODM4MXxhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFh"},"y":{"ks":"short"}};</script>`;

describe('readGalleryPage', () => {
    it('reads the gallery, partner, API host and sessions', () => {
        const page = readGalleryPage(PAGE, 'https://2358381.kaf.kaltura.com/channel/1941466/416353992');
        expect(page).toEqual({ origin: 'https://2358381.kaf.kaltura.com', categoryId: '416353992', partnerId: '2358381', serviceUrl: 'https://www.kaltura.com', sessions: ['djJ8MjM1ODM4MXxhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFh'] });
    });

    it('falls back to the page config for the category, and to the default API host', () => {
        const page = readGalleryPage('<script>{"categoryId":"77"}</script>', 'https://9.kaf.kaltura.com/somewhere');
        expect(page.categoryId).toBe('77');
        expect(page.serviceUrl).toBe('https://cdnapisec.kaltura.com');
        expect(pageSessions('{"ks":"tooShort"}')).toEqual([]);
    });
});

describe('dates and lengths', () => {
    it('reads the dates and durations the gallery prints', () => {
        expect(cardDate('From Jeremy Keffer October 15, 2026')).toBe('2026-10-15');
        expect(cardDate('no date here')).toBeNull();
        expect(durationMinutes('58:20duration 58 minutes')).toBe(58);
        expect(durationMinutes('01:17:35')).toBe(78);
        expect(capturedDay('Video Created by UD Capture Classroom Recording in Smith 120 on 2019-12-05 14:00:00.')).toBe('2019-12-05');
    });

    it('dates an entry by its classroom capture day before its upload time', () => {
        expect(entryLecture({ id: '1_a', name: ' Hashing ', createdAt: Date.UTC(2026, 9, 9, 15) / 1000, duration: 4500, description: 'recorded on 2026-10-07 10:00' })).toEqual({ id: '1_a', title: 'Hashing', date: '2026-10-07', minutes: 75 });
        expect(entryLecture({ name: 'no id' })).toBeNull();
    });
});

describe('bestCaption', () => {
    it('prefers a ready English track, then the default, then the most accurate', () => {
        const picked = bestCaption([
            { id: 'es', status: 2, languageCode: 'es', isDefault: true, accuracy: 99 },
            { id: 'machine', status: 2, languageCode: 'en', accuracy: 85 },
            { id: 'human', status: 2, languageCode: 'en', accuracy: 99 },
            { id: 'pending', status: 1, languageCode: 'en', accuracy: 100, isDefault: true },
        ]);
        expect(picked?.id).toBe('human');
        expect(bestCaption([])).toBeNull();
    });
});

describe('withSessions', () => {
    it('uses the first session Kaltura accepts, and reports the last refusal when none does', async () => {
        const call = async (ks: string) => {
            if (ks !== 'good') throw new KalturaError('nope', 'INVALID_KS');
            return 'captions';
        };
        expect(await withSessions(['bad', 'good', 'unused'], call)).toEqual({ value: 'captions', ks: 'good' });
        await expect(withSessions(['bad'], call)).rejects.toThrow('nope');
        await expect(withSessions([], call)).rejects.toThrow('no session');
    });
});
