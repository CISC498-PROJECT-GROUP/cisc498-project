// Builds the site into dist/: the app bundle from src/main.tsx (styles are imported as text and put
// in one <style> at start-up) and the static files (index.html, the icon) from static/. dist/ is what
// scripts/serve.ts — or any static host with /api relayed to the backend — serves.
//
// `--watch` rebuilds on every change under src/ or static/; refresh the browser to pick it up.

import { cpSync, rmSync, watch } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const DIST = join(ROOT, 'dist');
const is_watch = process.argv.includes('--watch');

export async function build(): Promise<boolean> {
    const started = performance.now();
    rmSync(DIST, { recursive: true, force: true });
    const result = await Bun.build({ entrypoints: [join(ROOT, 'src', 'main.tsx')], outdir: DIST, naming: 'app.js', target: 'browser', format: 'esm', minify: !is_watch, sourcemap: is_watch ? 'inline' : 'none' });
    if (!result.success) {
        for (const log of result.logs) console.error(log);
        console.error('[build] failed');
        return false;
    }
    cpSync(join(ROOT, 'static'), DIST, { recursive: true });
    console.log(`[build] dist/ ready in ${Math.round(performance.now() - started)}ms`);
    return true;
}

if (import.meta.main) {
    const ok = await build();
    if (!is_watch) process.exit(ok ? 0 : 1);
    let pending: ReturnType<typeof setTimeout> | undefined;
    const rebuild = () => {
        clearTimeout(pending);
        pending = setTimeout(() => void build(), 80);
    };
    watch(join(ROOT, 'src'), { recursive: true }, rebuild);
    watch(join(ROOT, 'static'), { recursive: true }, rebuild);
    console.log('[build] watching src/ and static/');
}
