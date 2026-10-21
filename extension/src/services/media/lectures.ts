// A course's recorded lectures and what was said in them — the public face of services/media.
//
// Opening a gallery takes a launch: Canvas signs it, the worker posts it to Kaltura, and Kaltura
// answers with the gallery page and a session cookie for its other pages. One opened gallery is kept
// per course for the page's lifetime (a failure is not kept, so the next call relaunches), and so is
// each transcript.
//
// Listing uses Kaltura's search over the gallery. If none of the page's sessions may search, the
// recordings on the gallery page itself are used — the newest ones — and the list says it may be
// incomplete. Captions are read with the gallery page's sessions, then the recording page's own
// (its player's), then Kaltura's public widget session.

import type { LectureRef } from '@canvas-assistant/shared';
import { captionsToText } from '@/services/media/captions';
import { galleryLaunch, galleryToolId, LectureError } from '@/services/media/gallery-launch';
import { captionFile, kaltura, KalturaError, searchGallery, withSessions } from '@/services/media/kaltura-api';
import { galleryCards, pageSessions, readGalleryPage, type GalleryPage } from '@/services/media/kaltura-parse';
import { webRequest } from '@/services/media/web';

export { LectureError };

export interface LectureList {
    lectures: LectureRef[];
    /** False when only the gallery page's newest recordings could be read. */
    complete: boolean;
}

interface Gallery extends LectureList {
    page: GalleryPage;
    /** Sessions to try, the last one that worked first. */
    sessions: string[];
}

const galleries = new Map<string, Promise<Gallery>>();
const transcripts = new Map<string, Promise<string | null>>();

async function openGallery(courseId: string): Promise<Gallery> {
    const toolId = await galleryToolId(courseId);
    if (toolId === null) throw new LectureError('This course has no Media Gallery, so there are no recorded lectures to read.');
    const form = await galleryLaunch(courseId, toolId);
    const reply = await webRequest({ url: form.action, method: 'POST', form: form.fields });
    if (!reply.ok) throw new LectureError(`The Media Gallery didn't open (${reply.error ?? `Kaltura answered ${reply.status}`}).`);
    const page = readGalleryPage(reply.text, reply.url);
    if (page.categoryId === null) throw new LectureError("The Media Gallery opened, but its list of recordings wasn't where the assistant looks for it.");

    let list: LectureList;
    try {
        list = { lectures: (await withSessions(page.sessions, (ks) => searchGallery(page, ks))).value, complete: true };
    } catch {
        list = { lectures: galleryCards(reply.text), complete: false };
    }
    const lectures = list.lectures.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    return { ...list, lectures, page, sessions: page.sessions };
}

function gallery(courseId: string): Promise<Gallery> {
    let open = galleries.get(courseId);
    if (!open) {
        open = openGallery(courseId).catch((error: unknown) => {
            galleries.delete(courseId);
            throw error;
        });
        galleries.set(courseId, open);
    }
    return open;
}

/** The course's recordings, oldest first. */
export async function loadLectures(courseId: string): Promise<LectureList> {
    const { lectures, complete } = await gallery(courseId);
    return { lectures, complete };
}

/** Sessions beyond the gallery page's: the recording page's player session, then the widget session. */
async function moreSessions(g: Gallery, entryId: string): Promise<string[]> {
    const extra: string[] = [];
    const entry = await webRequest({ url: `${g.page.origin}/media/t/${entryId}/${g.page.categoryId}`, method: 'GET' });
    if (entry.ok) extra.push(...pageSessions(entry.text));
    if (g.page.partnerId) {
        const widget = await kaltura<{ ks?: string }>(g.page, 'session', 'startWidgetSession', { widgetId: `_${g.page.partnerId}` }).catch(() => null);
        if (widget?.ks) extra.push(widget.ks);
    }
    return extra.filter((ks) => !g.sessions.includes(ks));
}

async function readTranscript(courseId: string, entryId: string): Promise<string | null> {
    const g = await gallery(courseId);
    const remember = (ks: string) => {
        g.sessions = [ks, ...g.sessions.filter((s) => s !== ks)];
    };
    let file: string | null;
    try {
        const found = await withSessions(g.sessions, (ks) => captionFile(g.page, entryId, ks));
        remember(found.ks);
        file = found.value;
    } catch {
        try {
            const found = await withSessions(await moreSessions(g, entryId), (ks) => captionFile(g.page, entryId, ks));
            remember(found.ks);
            file = found.value;
        } catch (error) {
            galleries.delete(courseId); // a session may have expired — the next call relaunches
            throw new LectureError(`Kaltura wouldn't share this recording's captions${error instanceof KalturaError ? ` (${error.code})` : ''}.`);
        }
    }
    const text = file === null ? '' : captionsToText(file);
    return text === '' ? null : text;
}

/** What was said in one recording, from its captions; null when it has none. */
export function loadTranscript(courseId: string, entryId: string): Promise<string | null> {
    const key = `${courseId}:${entryId}`;
    let read = transcripts.get(key);
    if (!read) {
        read = readTranscript(courseId, entryId).catch((error: unknown) => {
            transcripts.delete(key);
            throw error;
        });
        transcripts.set(key, read);
    }
    return read;
}
