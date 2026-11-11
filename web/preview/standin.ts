// The stand-in UD: a fake Canvas, Media Gallery, Stellic and WebReg over invented fixtures, so the
// whole site — sign-in, every view, chat tools, study PDFs and registration — runs without a UD login
// and without touching a real record. The backend (UD_STANDIN) sends what would go to
// https://<host>/<path> to <standin>/<host>/<path>; scripts/serve.ts hands it here with the URL in its
// real form, so fixtures can build absolute UD URLs from url.origin.
//
// Never bundled into the site: nothing under preview/ is imported by src/.

import { galleryRoute } from './canvas/gallery';
import { canvasRoute, fileDownload } from './canvas/routes';
import { submissionRoute, uploadRoute } from './canvas/submissions';
import { stellicRoute } from './stellic/routes';
import { webregRoute } from './webreg/routes';

type Route = (req: Request, url: URL) => Promise<Response | null> | Response | null;

async function canvas(req: Request, url: URL): Promise<Response | null> {
    if (url.pathname.startsWith('/api/v1/')) return req.method === 'POST' ? submissionRoute(req, url) : canvasRoute(url);
    return (await galleryRoute(req, url)) ?? fileDownload(url);
}

const ROUTES: { matches: (host: string) => boolean; route: Route }[] = [
    { matches: (h) => h === 'udel.instructure.com', route: canvas },
    { matches: (h) => h.endsWith('.inscloudgate.net'), route: (req, url) => (url.pathname === '/preview-upload' && req.method === 'POST' ? uploadRoute(req) : null) },
    { matches: (h) => h.endsWith('.kaltura.com'), route: galleryRoute },
    { matches: (h) => h === 'stellic.udel.edu', route: stellicRoute },
    { matches: (h) => h === 'webreg.nss.udel.edu', route: webregRoute },
];

/** A redirect a fixture answers with a relative Location, made absolute in real-UD form so the
    backend's proxy follows it to the right stand-in host. */
function absoluteLocation(response: Response, url: URL): Response {
    const location = response.headers.get('location');
    if (!location) return response;
    const headers = new Headers(response.headers);
    headers.set('location', new URL(location, url).href);
    return new Response(response.body, { status: response.status, headers });
}

/** `/__standin/<host>/<path>` → the fixture for that host, or 404. */
export async function standinRoute(req: Request, wire: URL): Promise<Response> {
    const [, , host = '', ...rest] = wire.pathname.split('/');
    const url = new URL(`https://${host}/${rest.join('/')}${wire.search}`);
    const route = ROUTES.find((r) => r.matches(host))?.route;
    const response = route ? await route(req, url) : null;
    return response ? absoluteLocation(response, url) : new Response('Not found in the stand-in UD', { status: 404 });
}
