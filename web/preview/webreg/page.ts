// The stand-in's /registration/schedule/<strm> page, laid out the way WebReg's is: Spring Security's
// CSRF meta tags, the term <select id="term">, and the data as inline-script vars (var schedule,
// var term, var maxCredits, …) that the site reads without running. Never bundled.

import { scheduleEntry } from './shapes';
import { REGISTERED, TERMS, type FakeTerm } from './state';

/** The token the stand-in expects as X-CSRF-TOKEN on every write. */
export const CSRF_TOKEN = 'standin-7f3c2a91-webreg-csrf';

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** JSON safe to sit inside a <script>: no `</script>` can close it early. */
const js = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

export function totalCredits(strm: string): number {
    return (REGISTERED[strm] ?? []).filter((e) => e.status === 'Enrolled').reduce((n, e) => n + e.credits, 0);
}

export function schedulePage(term: FakeTerm): Response {
    const { maxCredits, isAddPossible, ...termVar } = term;
    const options = TERMS.map((t) => `<option value="${t.strm}"${t.strm === term.strm ? ' selected' : ''}>${escape(t.descr)}</option>`).join('');
    const schedule = (REGISTERED[term.strm] ?? []).map((e) => scheduleEntry(term.strm, e));
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="_csrf" content="${CSRF_TOKEN}"/>
<meta name="_csrf_header" content="X-CSRF-TOKEN"/>
<title>WebReg - Schedule (stand-in)</title>
<link rel="stylesheet" href="/registration/css/schedule.css">
</head>
<body>
<header><h1>WebReg</h1><label for="term">Term</label> <select id="term" name="term">${options}</select></header>
<main id="schedule-app"><p>Loading your schedule…</p></main>
<script>
var contextPath = "/registration";
var schedule = ${js(schedule)};
var term = ${js(termVar)};
var maxCredits = ${maxCredits};
var totalCredits = ${totalCredits(term.strm)};
var readOnly = false;
var isAddPossible = ${isAddPossible};
var swapOnly = false;
</script>
<script src="/registration/js/schedule.js"></script>
</body>
</html>`;
    return new Response(html, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
}
