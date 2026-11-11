// Kaltura's API, called with the sessions the student's gallery page carries (chosen among by
// withSessions, kaltura-sessions.ts). Every call is a plain read: list a gallery's entries, find an
// entry's captions — through the caption API, or the way Kaltura's player does — and fetch them.

import type { LectureRef } from '@canvas-assistant/shared';
import { bestCaption, entryLecture, type CaptionAsset, type RawEntry, type GalleryPage } from '@/services/media/kaltura-parse';
import { KalturaError } from '@/services/media/kaltura-sessions';
import { webRequest } from '@/services/media/web';

export { KalturaError, withSessions } from '@/services/media/kaltura-sessions';

/** One API call (JSON in, JSON out). Kaltura reports failures as a 200 with an exception object. */
export async function kaltura<T>(page: GalleryPage, service: string, action: string, params: Record<string, unknown>, ks?: string): Promise<T> {
    const reply = await webRequest({ url: `${page.serviceUrl}/api_v3/service/${service}/action/${action}`, method: 'POST', json: { ...params, ...(ks ? { ks } : {}), format: 1 } });
    if (!reply.ok) throw new KalturaError(reply.error ?? `HTTP ${reply.status}`, 'HTTP');
    let body: { objectType?: string; code?: string; message?: string };
    try {
        body = JSON.parse(reply.text) as typeof body;
    } catch {
        throw new KalturaError('Kaltura answered with something other than JSON.', 'FORMAT');
    }
    if (body?.objectType === 'KalturaAPIException') throw new KalturaError(body.message ?? 'Kaltura refused the request.', body.code ?? 'UNKNOWN');
    return body as T;
}

/** Every entry in the gallery's category, via Kaltura's search — the call the gallery's own search
    box makes. Paged; a gallery of more than 2,000 recordings is not a course. */
export async function searchGallery(page: GalleryPage, ks: string): Promise<LectureRef[]> {
    const out: LectureRef[] = [];
    for (let pageIndex = 1; pageIndex <= 4; pageIndex++) {
        const result = await kaltura<{ objects?: { object?: RawEntry }[]; totalCount?: number }>(
            page,
            'elasticsearch_esearch',
            'searchEntry',
            {
                searchParams: {
                    objectType: 'KalturaESearchEntryParams',
                    searchOperator: { objectType: 'KalturaESearchEntryOperator', operator: 1, searchItems: [{ objectType: 'KalturaESearchCategoryEntryItem', fieldName: 'id', itemType: 1, searchTerm: page.categoryId, categoryEntryStatus: 2 }] },
                    orderBy: { objectType: 'KalturaESearchOrderBy', orderItems: [{ objectType: 'KalturaESearchEntryOrderByItem', sortField: 'created_at', sortOrder: 'desc' }] },
                },
                pager: { objectType: 'KalturaPager', pageSize: 500, pageIndex },
            },
            ks,
        );
        const batch = (result.objects ?? []).map((hit) => entryLecture(hit.object ?? {})).filter((l): l is LectureRef => l !== null);
        out.push(...batch);
        if (batch.length < 500 || out.length >= (result.totalCount ?? 0)) break;
    }
    return out;
}

/** A caption file Kaltura pointed to. An exception object served in its place is a refusal. */
async function fetchCaption(url: string): Promise<string> {
    const reply = await webRequest({ url, method: 'GET' });
    if (!reply.ok) throw new KalturaError(reply.error ?? `HTTP ${reply.status}`, 'HTTP');
    if (/"objectType"\s*:\s*"KalturaAPIException"|<objectType>KalturaAPIException/.test(reply.text.slice(0, 400))) throw new KalturaError('Kaltura refused the caption file.', 'SERVE');
    return reply.text;
}

/** Through the caption API: list the entry's tracks, serve the best one. */
async function listedCaption(page: GalleryPage, entryId: string, ks: string): Promise<string | null> {
    const list = await kaltura<{ objects?: CaptionAsset[] }>(page, 'caption_captionasset', 'list', { filter: { objectType: 'KalturaAssetFilter', entryIdEqual: entryId }, pager: { objectType: 'KalturaFilterPager', pageSize: 50 } }, ks);
    const asset = bestCaption(list.objects ?? []);
    return asset ? fetchCaption(`${page.serviceUrl}/api_v3/index.php/service/caption_captionasset/action/serve/captionAssetId/${asset.id}/ks/${ks}`) : null;
}

interface PlaybackCaption {
    url?: string;
    webVttUrl?: string;
    language?: string;
    languageCode?: string;
    isDefault?: boolean;
}

/** The way Kaltura's own player finds captions: the entry's playback context lists each track with
    the URL to fetch it by, which the player completes with its session. */
async function playbackCaption(page: GalleryPage, entryId: string, ks: string): Promise<string | null> {
    const context = await kaltura<{ playbackCaptions?: PlaybackCaption[] }>(page, 'baseentry', 'getPlaybackContext', { entryId, contextDataParams: { objectType: 'KalturaPlaybackContextOptions' } }, ks);
    const track = bestCaption((context.playbackCaptions ?? []).map((c) => ({ ...c, id: c.webVttUrl || c.url })));
    if (!track?.id) return null;
    if (/\/ks\//.test(track.id)) return fetchCaption(track.id);
    return fetchCaption(track.id).catch(() => fetchCaption(`${track.id!.replace(/\/+$/, '')}/ks/${ks}`));
}

/** An entry's captions as the raw caption file, or null when it has none: through the caption API,
    or — when this session may not use it — the way the player does. */
export async function captionFile(page: GalleryPage, entryId: string, ks: string): Promise<string | null> {
    try {
        return await listedCaption(page, entryId, ks);
    } catch (error) {
        if (!(error instanceof KalturaError)) throw error;
        return playbackCaption(page, entryId, ks);
    }
}
