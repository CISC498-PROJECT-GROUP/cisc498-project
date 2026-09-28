// Builds the unpacked extension into dist/: the content script and the background service worker,
// each bundled from src/, plus the manifest from static/. Load dist/ in chrome://extensions with
// "Load unpacked".
//
// The backend address is baked in at build time from CANVAS_ASSISTANT_API (default
// http://localhost:3010), and its origin is added to the manifest's host_permissions here — so the
// address the code calls and the one Chrome permits cannot drift apart.
//
// `--watch` rebuilds on every change under src/ or static/. Chrome does not pick a rebuild up by
// itself: press the reload arrow on the extension's card, then refresh the Canvas tab.
//
// IIFE, not ESM: Chrome runs a content script as a classic script, so the bundle must not contain
// a top-level import or export.

import { cpSync, readFileSync, rmSync, watch, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const DIST = join(ROOT, 'dist');
const is_watch = process.argv.includes('--watch');
const API_BASE = (process.env.CANVAS_ASSISTANT_API ?? 'http://localhost:3010').replace(/\/+$/, '');

async function build(): Promise<boolean> {
    const started = performance.now();
    rmSync(DIST, { recursive: true, force: true });
    const result = await Bun.build({
        entrypoints: [join(ROOT, 'src', 'content.tsx'), join(ROOT, 'src', 'background.ts')],
        outdir: DIST,
        naming: '[name].js',
        target: 'browser',
        format: 'iife',
        minify: !is_watch,
        sourcemap: is_watch ? 'inline' : 'none',
        define: { __API_BASE__: JSON.stringify(API_BASE) },
    });
    if (!result.success) {
        for (const log of result.logs) console.error(log);
        console.error('[build] failed');
        return false;
    }
    cpSync(join(ROOT, 'static'), DIST, { recursive: true });
    const manifest = JSON.parse(readFileSync(join(ROOT, 'static', 'manifest.json'), 'utf8'));
    manifest.host_permissions = [...manifest.host_permissions, `${new URL(API_BASE).origin}/*`];
    writeFileSync(join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 4));
    console.log(`[build] dist/ ready in ${Math.round(performance.now() - started)}ms — backend ${API_BASE}`);
    return true;
}

const ok = await build();

if (!is_watch) process.exit(ok ? 0 : 1);

let pending: ReturnType<typeof setTimeout> | undefined;
const rebuild = () => {
    clearTimeout(pending);
    pending = setTimeout(() => void build(), 80);
};
watch(join(ROOT, 'src'), { recursive: true }, rebuild);
watch(join(ROOT, 'static'), { recursive: true }, rebuild);
console.log('[build] watching src/ and static/ — reload the extension in chrome://extensions after a rebuild');
