// Reading Kaltura's gallery pages. After the launch, Kaltura answers with the course's gallery page:
// its address names the gallery (a Kaltura category), its inline configuration carries the API
// address and the Kaltura sessions (KS) the page's own scripts use, and its markup lists the newest
// recordings. The text helpers are pure and tested; the markup reader needs a DOM.

import type { LectureRef } from '@canvas-assistant/shared';
import { isoDay } from '@/services/format/dates';

export interface GalleryPage {
    /** The gallery's own origin, e.g. https://2358381.kaf.kaltura.com. */
    origin: string;
    categoryId: string | null;
    partnerId: string | null;
    /** Kaltura's API host. */
    serviceUrl: string;
    /** Every Kaltura session the page carries, in page order. */
    sessions: string[];
}

const DEFAULT_SERVICE = 'https://cdnapisec.kaltura.com';

const unescapeJson = (text: string): string => text.replace(/\\\//g, '/');

/** Kaltura sessions in a page's inline configuration ("ks":"djJ8…"). */
export const pageSessions = (html: string): string[] => [...new Set([...html.matchAll(/"ks"\s*:\s*"([A-Za-z0-9_\-|=+/]{40,})"/g)].map((match) => match[1]!))];

export function readGalleryPage(html: string, url: string): GalleryPage {
    const address = new URL(url);
    const service = /"serviceUrl"\s*:\s*"(https?:[^"]+)"/.exec(html)?.[1];
    return {
        origin: address.origin,
        categoryId: /\/channel\/[^/]+\/(\d+)/.exec(address.pathname)?.[1] ?? /"categoryId"\s*:\s*"?(\d+)/.exec(html)?.[1] ?? null,
        partnerId: /^(\d+)\.kaf\.kaltura\.com$/.exec(address.hostname)?.[1] ?? /"partnerId"\s*:\s*"?(\d+)/.exec(html)?.[1] ?? null,
        serviceUrl: service ? unescapeJson(service).replace(/\/+$/, '') : DEFAULT_SERVICE,
        sessions: pageSessions(html),
    };
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const pad = (n: number): string => String(n).padStart(2, '0');

/** "October 15, 2026" (as the gallery prints it) → "2026-10-15". */
export function cardDate(text: string): string | null {
    const match = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})\b/i.exec(text);
    if (!match) return null;
    return `${match[3]}-${pad(MONTHS.indexOf(match[1]!.toLowerCase()) + 1)}-${pad(Number(match[2]))}`;
}

/** "58:20" or "01:17:35" → whole minutes. */
export function durationMinutes(text: string): number | null {
    // No \b at the end: the gallery runs the length into its label ("58:20duration 58 minutes").
    const match = /(?<![\d:])(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?!\d)/.exec(text);
    if (!match) return null;
    return Math.round(Number(match[1] ?? 0) * 60 + Number(match[2]) + Number(match[3]) / 60);
}

/** A classroom capture's description names the day it was recorded ("… on 2019-12-05 14:00:00");
    that beats the upload time, which can be days later. */
export const capturedDay = (description: string): string | null => /\bon (\d{4}-\d{2}-\d{2})\b/.exec(description)?.[1] ?? null;

/** The recordings the gallery page itself lists: one card per entry, linked as /media/…/<entryId>/…. */
export function galleryCards(html: string): LectureRef[] {
    const page = new DOMParser().parseFromString(html, 'text/html');
    const byId = new Map<string, HTMLAnchorElement[]>();
    for (const link of page.querySelectorAll<HTMLAnchorElement>('a[href*="/media/"]')) {
        const id = /\/media\/[^/]+\/([01]_[a-z0-9]{6,})/i.exec(link.getAttribute('href') ?? '')?.[1];
        if (id) byId.set(id, [...(byId.get(id) ?? []), link]);
    }
    const cards: LectureRef[] = [];
    for (const [id, links] of byId) {
        // The card is the widest ancestor whose links all point at this one entry.
        let card: Element = links[0]!;
        while (card.parentElement && [...card.parentElement.querySelectorAll('a[href*="/media/"]')].every((a) => (a.getAttribute('href') ?? '').includes(id))) card = card.parentElement;
        const titles = links.map((a) => (a.getAttribute('title') || a.textContent || '').replace(/\s+/g, ' ').trim()).filter((t) => t !== '' && !/^\d+$/.test(t) && !/\d+ of \d+/.test(t));
        const text = card.textContent ?? '';
        cards.push({ id, title: titles.sort((a, b) => b.length - a.length)[0] ?? 'Untitled recording', date: cardDate(text) ?? '', minutes: durationMinutes(text) });
    }
    return cards;
}

export interface RawEntry {
    id?: string;
    name?: string;
    description?: string;
    createdAt?: number;
    duration?: number;
}

export const entryLecture = (entry: RawEntry): LectureRef | null =>
    entry.id
        ? {
              id: entry.id,
              title: entry.name?.trim() || 'Untitled recording',
              date: capturedDay(entry.description ?? '') ?? (entry.createdAt ? isoDay(new Date(entry.createdAt * 1000)) : ''),
              minutes: entry.duration ? Math.round(entry.duration / 60) : null,
          }
        : null;

export interface CaptionAsset {
    id?: string;
    status?: number;
    language?: string;
    languageCode?: string;
    isDefault?: boolean | number;
    accuracy?: number;
}

/** The caption track worth reading: ready (status 2), English first, then the default, then the most
    accurate (a human-corrected track scores higher than a machine one). */
export function bestCaption(assets: CaptionAsset[]): CaptionAsset | null {
    const ready = assets.filter((asset) => asset.id && (asset.status === undefined || asset.status === 2));
    const score = (a: CaptionAsset) => (/^en/i.test(a.languageCode ?? a.language ?? '') ? 1000 : 0) + (a.isDefault === true || a.isDefault === 1 ? 200 : 0) + (a.accuracy ?? 0);
    return ready.sort((a, b) => score(b) - score(a))[0] ?? null;
}
