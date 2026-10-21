// A stand-in Media Gallery for course 101, shaped like Kaltura's: the Canvas tab, the signed launch
// form Canvas renders for it, the gallery page the launch lands on (with its sessions in an inline
// config), Kaltura's search and caption API, and a recording page. The gallery page carries two
// sessions, as Kaltura's do: the player's, which may only fetch playback (so captions come the way
// the player finds them), and the search box's, which may search and list captions. Both of the
// extension's routes to captions, and its try-the-next-session path, run here. Never bundled.

import { captionSrt, GALLERY_CATEGORY, LECTURES } from './lectures';

const COURSE = 101;
const TOOL = '77';
const NARROW_KS = 'djJ8cHJldmlldy1uYXJyb3ctc2Vzc2lvbi10aGF0LWNhbm5vdC1zZWFyY2gtb3ItcmVhZC1jYXB0aW9ucw';
const WIDE_KS = 'djJ8cHJldmlldy13aWRlLXNlc3Npb24tdGhhdC1jYW4tc2VhcmNoLWFuZC1yZWFkLWNhcHRpb25z';

const json = (body: unknown, status = 200) => Response.json(body, { status });
const html = (body: string) => new Response(`<!doctype html><html><body>${body}</body></html>`, { headers: { 'content-type': 'text/html' } });
const refused = (message: string) => json({ objectType: 'KalturaAPIException', code: 'INVALID_KS', message });

/** Canvas API routes for the gallery tab and its launch. */
export function galleryCanvasRoute(path: string): Response | null {
    let m: RegExpExecArray | null;
    if ((m = /^\/courses\/(\d+)\/tabs$/.exec(path))) {
        const tabs = [{ id: 'home', label: 'Home', type: 'internal', html_url: `/courses/${m[1]}` }];
        if (Number(m[1]) === COURSE) tabs.push({ id: `context_external_tool_${TOOL}`, label: 'Media Gallery', type: 'external', html_url: `/courses/${COURSE}/external_tools/${TOOL}` });
        return json(tabs);
    }
    if (path === `/courses/${COURSE}/external_tools/sessionless_launch`) return json({ id: Number(TOOL), name: 'Media Gallery', url: `/courses/${COURSE}/external_tools/sessionless_launch?verifier=preview` });
    return null;
}

const card = (l: (typeof LECTURES)[number], i: number) => {
    const day = new Date(l.createdAt * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const length = `${Math.floor(l.seconds / 60)}:${String(l.seconds % 60).padStart(2, '0')}`;
    return `<li class="entry"><a href="/media/t/${l.id}/${GALLERY_CATEGORY}">${l.title} ${i + 1} of ${LECTURES.length} ${length}</a><a href="/media/t/${l.id}/${GALLERY_CATEGORY}" title="${l.title}">${l.title}</a><p>From Anita Patel ${day}</p></li>`;
};

function kalturaApi(url: URL, body: Record<string, unknown>): Response {
    const action = url.pathname.replace(/^\/preview-kaltura\/api_v3\/service\//, '');
    if (action === 'session/action/startWidgetSession') return json({ ks: 'djJ8cHJldmlldy13aWRnZXQtc2Vzc2lvbi13aXRoLW5vLWFjY2Vzcy10by1hbnl0aGluZw', partnerId: 0 });
    if (action === 'baseentry/action/getPlaybackContext' && body.ks === NARROW_KS) {
        const entry = String(body.entryId ?? '');
        const serve = `${url.origin}/preview-kaltura/api_v3/index.php/service/caption_captionasset/action/serve/captionAssetId/cap_${entry}`;
        const playbackCaptions = captionSrt(entry) === null ? [] : [{ label: 'English', format: '1', language: 'English', languageCode: 'en', isDefault: true, url: serve, webVttUrl: serve }];
        return json({ objectType: 'KalturaPlaybackContext', playbackCaptions });
    }
    if (body.ks !== WIDE_KS) return refused('Invalid KS "EXCEEDED_RESTRICTED_URI"');
    if (action === 'elasticsearch_esearch/action/searchEntry') {
        const objects = LECTURES.map((l) => ({ objectType: 'KalturaESearchEntryResult', object: { id: l.id, name: l.title, description: l.description, createdAt: l.createdAt, duration: l.seconds } }));
        return json({ objectType: 'KalturaESearchEntryResponse', objects, totalCount: objects.length });
    }
    if (action === 'caption_captionasset/action/list') {
        const entry = String((body.filter as { entryIdEqual?: string } | undefined)?.entryIdEqual ?? '');
        const objects = captionSrt(entry) === null ? [] : [{ id: `cap_${entry}`, entryId: entry, status: 2, format: 1, language: 'English', languageCode: 'en', isDefault: true, accuracy: 86 }];
        return json({ objectType: 'KalturaCaptionAssetListResponse', objects, totalCount: objects.length });
    }
    return json({ objectType: 'KalturaAPIException', code: 'SERVICE_FORBIDDEN', message: `preview has no ${action}` });
}

/** Everything that is not the Canvas API: the launch page, the gallery, and Kaltura's API. */
export async function galleryRoute(req: Request, url: URL): Promise<Response | null> {
    const p = url.pathname;
    if (p === `/courses/${COURSE}/external_tools/sessionless_launch`) {
        const fields = { oauth_consumer_key: 'preview', oauth_signature: 'preview-signature', lti_message_type: 'basic-lti-launch-request', custom_canvas_course_id: String(COURSE) };
        const inputs = Object.entries(fields)
            .map(([name, value]) => `<input type="hidden" name="${name}" value="${value}">`)
            .join('');
        return html(`<form action="/preview-kaf/canvas/index/launch/target/course-gallery" method="POST" target="_self">${inputs}</form>`);
    }
    if (p === '/preview-kaf/canvas/index/launch/target/course-gallery' && req.method === 'POST') {
        const form = await req.formData();
        if (form.get('oauth_signature') !== 'preview-signature') return new Response('bad launch', { status: 403 });
        return new Response(null, { status: 302, headers: { location: `/preview-kaf/channel/${COURSE}/${GALLERY_CATEGORY}` } });
    }
    if (p === `/preview-kaf/channel/${COURSE}/${GALLERY_CATEGORY}`) {
        const config = `<script>window.kmsConfig = {"partnerId":"0","serviceUrl":"${url.origin}\\/preview-kaltura","player":{"ks":"${NARROW_KS}"},"esearch":{"ks":"${WIDE_KS}"}};</script>`;
        const newest = [...LECTURES].reverse().slice(0, 6);
        return html(`${config}<h1>Media Gallery</h1><ul>${newest.map(card).join('')}</ul>`);
    }
    if (/^\/media\/t\//.test(p)) return html(`<script>var player = {"ks":"${WIDE_KS}"};</script>`);
    let m: RegExpExecArray | null;
    if ((m = /^\/preview-kaltura\/api_v3\/index\.php\/service\/caption_captionasset\/action\/serve\/captionAssetId\/cap_([\w]+)\/ks\/(.+)$/.exec(p))) {
        const srt = m[2] === WIDE_KS || m[2] === NARROW_KS ? captionSrt(m[1]!) : null;
        return srt === null ? refused('Invalid KS') : new Response(srt, { headers: { 'content-type': 'text/plain' } });
    }
    if (p.startsWith('/preview-kaltura/api_v3/service/') && req.method === 'POST') return kalturaApi(url, (await req.json().catch(() => ({}))) as Record<string, unknown>);
    return null;
}
